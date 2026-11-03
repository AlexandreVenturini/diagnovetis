alter table public.exames
  add column if not exists modelo text,
  add column if not exists dados_especificos jsonb not null default '{}'::jsonb;

alter table public.exames drop constraint if exists exames_dados_especificos_validos;
alter table public.exames add constraint exames_dados_especificos_validos
  check (jsonb_typeof(dados_especificos) = 'object' and pg_column_size(dados_especificos) <= 20000);

CREATE OR REPLACE FUNCTION public.salvar_atendimento(p_id integer, p_consulta jsonb, p_exames jsonb, p_participantes uuid[], p_finalizar boolean)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_papel text := public.meu_papel_aprovado();
  v_atual public.consultas;
  v_novo public.consultas;
  v_id integer;
  v_exame jsonb;
  v_editaveis text[] := array[
    'pet_id', 'data_consulta', 'horario', 'agendamento_id', 'observacoes', 'diagnostico', 'conduta',
    'diagnostico_zoonose_status', 'diagnostico_zoonose_observacoes', 'diagnostico_zoonose_data_confirmacao',
    'temperatura', 'frequencia_cardiaca', 'frequencia_respiratoria', 'tpc', 'mucosas', 'hidratacao',
    'nivel_consciencia', 'pele_pelagem', 'olhos', 'ouvidos', 'boca_dentes', 'sistema_respiratorio',
    'sistema_cardiovascular', 'sistema_gastrointestinal', 'sistema_urinario', 'sistema_reprodutivo',
    'sistema_neurologico', 'dor', 'alta_data', 'alta_condicao', 'alta_orientacoes', 'alta_prognostico'
  ];
begin
  if v_uid is null or v_papel is null then
    raise exception 'Usuário sem permissão para registrar atendimentos';
  end if;

  if p_id is null then
    perform pg_advisory_xact_lock(hashtext('consultas_id'));
    select coalesce(max(id), 0) + 1 into v_id from public.consultas;
    v_novo := jsonb_populate_record(null::public.consultas, p_consulta);
    v_novo.id := v_id;
    v_novo.situacao := case when p_finalizar then 'finalizado' else 'aberto' end;
    v_novo.finalizado_em := case when p_finalizar then now() else null end;
    v_novo.atualizado_em := now();
    insert into public.consultas select v_novo.*;
  else
    select * into v_atual from public.consultas where id = p_id for update;
    if v_atual.id is null then
      raise exception 'Atendimento não encontrado';
    end if;
    if v_atual.situacao <> 'aberto' then
      raise exception 'Este atendimento já foi finalizado';
    end if;
    if not public.envolvido_no_atendimento(p_id) then
      raise exception 'Sem permissão para continuar este atendimento';
    end if;

    v_id := p_id;
    v_novo := jsonb_populate_record(
      v_atual,
      (select coalesce(jsonb_object_agg(key, value), '{}'::jsonb) from jsonb_each(p_consulta) where key = any(v_editaveis))
    );
    if v_papel = 'veterinarian' and p_consulta ? 'responsavel_id' then
      v_novo.responsavel_id := (p_consulta->>'responsavel_id')::integer;
    end if;

    perform set_config('app.salvando_atendimento', 'on', true);
    update public.consultas set
      pet_id = v_novo.pet_id,
      responsavel_id = v_novo.responsavel_id,
      data_consulta = v_novo.data_consulta,
      horario = v_novo.horario,
      agendamento_id = v_novo.agendamento_id,
      observacoes = v_novo.observacoes,
      diagnostico = v_novo.diagnostico,
      conduta = v_novo.conduta,
      diagnostico_zoonose_status = v_novo.diagnostico_zoonose_status,
      diagnostico_zoonose_observacoes = v_novo.diagnostico_zoonose_observacoes,
      diagnostico_zoonose_data_confirmacao = v_novo.diagnostico_zoonose_data_confirmacao,
      temperatura = v_novo.temperatura,
      frequencia_cardiaca = v_novo.frequencia_cardiaca,
      frequencia_respiratoria = v_novo.frequencia_respiratoria,
      tpc = v_novo.tpc,
      mucosas = v_novo.mucosas,
      hidratacao = v_novo.hidratacao,
      nivel_consciencia = v_novo.nivel_consciencia,
      pele_pelagem = v_novo.pele_pelagem,
      olhos = v_novo.olhos,
      ouvidos = v_novo.ouvidos,
      boca_dentes = v_novo.boca_dentes,
      sistema_respiratorio = v_novo.sistema_respiratorio,
      sistema_cardiovascular = v_novo.sistema_cardiovascular,
      sistema_gastrointestinal = v_novo.sistema_gastrointestinal,
      sistema_urinario = v_novo.sistema_urinario,
      sistema_reprodutivo = v_novo.sistema_reprodutivo,
      sistema_neurologico = v_novo.sistema_neurologico,
      dor = v_novo.dor,
      alta_data = v_novo.alta_data,
      alta_condicao = v_novo.alta_condicao,
      alta_orientacoes = v_novo.alta_orientacoes,
      alta_prognostico = v_novo.alta_prognostico,
      situacao = case when p_finalizar then 'finalizado' else 'aberto' end,
      finalizado_em = case when p_finalizar then now() else null end,
      atualizado_em = now()
    where id = p_id;
    perform set_config('app.salvando_atendimento', 'off', true);

    delete from public.exames where consulta_id = p_id;
  end if;

  for v_exame in select value from jsonb_array_elements(coalesce(p_exames, '[]'::jsonb)) loop
    if nullif(btrim(v_exame->>'nome_exame'), '') is null then
      raise exception 'Nome do exame obrigatório';
    end if;
    insert into public.exames (
      id, consulta_id, nome_exame, data_exame, categoria, data_solicitacao, data_realizacao, status,
      resultado, interpretacao_clinica, laudo, laudo_anexo, modelo, dados_especificos
    ) values (
      coalesce((v_exame->>'id')::integer, nextval('public.exames_id_seq')), v_id,
      v_exame->>'nome_exame', (v_exame->>'data_exame')::timestamptz, v_exame->>'categoria',
      (v_exame->>'data_solicitacao')::date, (v_exame->>'data_realizacao')::date, v_exame->>'status',
      coalesce(v_exame->>'resultado', ''), coalesce(v_exame->>'interpretacao_clinica', ''),
      coalesce(v_exame->>'laudo', ''), nullif(v_exame->'laudo_anexo', 'null'::jsonb),
      nullif(btrim(v_exame->>'modelo'), ''),
      case when jsonb_typeof(v_exame->'dados_especificos') = 'object' then v_exame->'dados_especificos' else '{}'::jsonb end
    );
  end loop;

  delete from public.consulta_participantes where consulta_id = v_id and papel = 'participante';
  insert into public.consulta_participantes (consulta_id, profile_id, papel, nome)
  select v_id, p.id, 'participante', p.name
  from public.profiles p
  where p.id = any(coalesce(p_participantes, '{}'))
    and p.role = 'attendant'
    and p.status = 'aprovado'
  on conflict do nothing;

  return v_id;
end;
$function$;

notify pgrst, 'reload schema';
