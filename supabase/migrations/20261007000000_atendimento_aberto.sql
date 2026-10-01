alter table public.consultas
  add column if not exists situacao text not null default 'finalizado',
  add column if not exists finalizado_em timestamptz,
  add column if not exists atualizado_em timestamptz not null default now(),
  add column if not exists agendamento_id bigint;

do $$
begin
  alter table public.consultas add constraint consultas_situacao_check check (situacao in ('aberto', 'finalizado'));
exception when duplicate_object then null;
end $$;

update public.consultas set finalizado_em = data_consulta where situacao = 'finalizado' and finalizado_em is null;

create index if not exists consultas_abertas_idx on public.consultas (atualizado_em) where situacao = 'aberto';

create or replace function public.preencher_situacao_consulta()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.situacao := coalesce(new.situacao, 'finalizado');
  new.atualizado_em := coalesce(new.atualizado_em, now());
  if new.situacao = 'finalizado' then
    new.finalizado_em := coalesce(new.finalizado_em, now());
  end if;
  return new;
end;
$$;

drop trigger if exists consultas_preencher_situacao on public.consultas;
create trigger consultas_preencher_situacao
  before insert on public.consultas
  for each row execute function public.preencher_situacao_consulta();

create or replace function public.envolvido_no_atendimento(p_consulta integer)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.consultas c
    where c.id = p_consulta
      and (
        c.registrado_por = auth.uid()
        or c.supervisor_id = auth.uid()
        or exists (
          select 1 from public.consulta_participantes cp
          where cp.consulta_id = c.id and cp.profile_id = auth.uid()
        )
      )
  );
$$;

create or replace function public.bloquear_edicao_direta_consulta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null and coalesce(auth.role(), '') <> 'anon' then
    return coalesce(new, old);
  end if;

  if tg_op = 'DELETE' then
    if public.is_admin() then
      return old;
    end if;
    if old.situacao = 'aberto' and coalesce(current_setting('app.descartando', true), '') = 'on' then
      return old;
    end if;
    raise exception 'Atendimentos não podem ser excluídos';
  end if;

  if coalesce(current_setting('app.retificando', true), '') = 'on' then
    return new;
  end if;

  if old.situacao = 'aberto' and coalesce(current_setting('app.salvando_atendimento', true), '') = 'on' then
    return new;
  end if;

  if (to_jsonb(new) - array['registrado_por', 'supervisor_id', 'liberacao_id', 'retificado_por'])
     = (to_jsonb(old) - array['registrado_por', 'supervisor_id', 'liberacao_id', 'retificado_por']) then
    return new;
  end if;

  if old.situacao = 'aberto' then
    raise exception 'Atendimentos em andamento só podem ser alterados pela tela de atendimento';
  end if;

  raise exception 'Atendimentos finalizados só podem ser alterados por retificação';
end;
$$;

create or replace function public.salvar_atendimento(
  p_id integer,
  p_consulta jsonb,
  p_exames jsonb,
  p_participantes uuid[],
  p_finalizar boolean
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
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
      resultado, interpretacao_clinica, laudo, laudo_anexo
    ) values (
      coalesce((v_exame->>'id')::integer, nextval('public.exames_id_seq')), v_id,
      v_exame->>'nome_exame', (v_exame->>'data_exame')::timestamptz, v_exame->>'categoria',
      (v_exame->>'data_solicitacao')::date, (v_exame->>'data_realizacao')::date, v_exame->>'status',
      coalesce(v_exame->>'resultado', ''), coalesce(v_exame->>'interpretacao_clinica', ''),
      coalesce(v_exame->>'laudo', ''), nullif(v_exame->'laudo_anexo', 'null'::jsonb)
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
$$;

create or replace function public.descartar_atendimento(p_consulta integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_atual public.consultas;
begin
  select * into v_atual from public.consultas where id = p_consulta for update;
  if v_atual.id is null then
    raise exception 'Atendimento não encontrado';
  end if;
  if v_atual.situacao <> 'aberto' then
    raise exception 'Só atendimentos em andamento podem ser descartados';
  end if;
  if auth.uid() is distinct from v_atual.registrado_por and auth.uid() is distinct from v_atual.supervisor_id then
    raise exception 'Só quem iniciou ou o veterinário responsável pode descartar este atendimento';
  end if;

  delete from public.exames where consulta_id = p_consulta;
  perform set_config('app.descartando', 'on', true);
  delete from public.consultas where id = p_consulta;
  perform set_config('app.descartando', 'off', true);
end;
$$;

drop function if exists public.atendimentos_em_andamento();
create function public.atendimentos_em_andamento()
returns table (
  id integer,
  pet_id integer,
  pet_nome text,
  tutor_nome text,
  data_consulta timestamptz,
  atualizado_em timestamptz,
  iniciado_por text,
  veterinario text,
  agendamento_id bigint,
  pode_descartar boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.pet_id, p.nome, t.nome, c.data_consulta, c.atualizado_em, coalesce(rp.name, ''), coalesce(m.nome, ''),
    c.agendamento_id,
    c.registrado_por = auth.uid() or c.supervisor_id = auth.uid()
  from public.consultas c
  join public.pets p on p.id = c.pet_id
  left join public.tutores t on t.id = p.tutor_id
  left join public.profiles rp on rp.id = c.registrado_por
  left join public.medicos m on m.id = c.responsavel_id
  where c.situacao = 'aberto' and public.envolvido_no_atendimento(c.id)
  order by c.atualizado_em desc;
$$;

create or replace function public.retificar_consulta(p_consulta integer, p_campos jsonb, p_motivo text, p_liberacao uuid default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_papel text := public.meu_papel_aprovado();
  v_atual public.consultas;
  v_novo public.consultas;
  v_liberacao public.liberacoes_atendimento;
  v_campos jsonb;
  v_nome text;
  v_aprovador uuid;
  v_aprovador_nome text;
  v_editaveis text[] := array[
    'observacoes', 'diagnostico', 'conduta', 'diagnostico_zoonose_status', 'diagnostico_zoonose_observacoes',
    'temperatura', 'frequencia_cardiaca', 'frequencia_respiratoria', 'tpc', 'mucosas', 'hidratacao',
    'nivel_consciencia', 'pele_pelagem', 'olhos', 'ouvidos', 'boca_dentes', 'sistema_respiratorio',
    'sistema_cardiovascular', 'sistema_gastrointestinal', 'sistema_urinario', 'sistema_reprodutivo',
    'sistema_neurologico', 'dor', 'alta_data', 'alta_condicao', 'alta_orientacoes', 'alta_prognostico'
  ];
begin
  if nullif(btrim(coalesce(p_motivo, '')), '') is null then
    raise exception 'Informe o motivo da retificação';
  end if;

  select * into v_atual from public.consultas where id = p_consulta for update;
  if v_atual.id is null then
    raise exception 'Atendimento não encontrado';
  end if;
  if v_atual.situacao <> 'finalizado' then
    raise exception 'Atendimento ainda em andamento: finalize antes de retificar';
  end if;

  select name into v_nome from public.profiles where id = v_uid;

  if v_papel = 'veterinarian' then
    v_aprovador := v_uid;
    v_aprovador_nome := v_nome;
  elsif v_papel = 'attendant' then
    select * into v_liberacao from public.liberacoes_atendimento
      where id = p_liberacao and aluno_id = v_uid and status = 'aberta'
        and tipo = 'retificacao' and consulta_alvo = p_consulta
      for update;
    if v_liberacao.id is null then
      raise exception 'Retificação sem liberação válida do professor';
    end if;
    v_aprovador := v_liberacao.supervisor_id;
    select name into v_aprovador_nome from public.profiles where id = v_aprovador;
  else
    raise exception 'Usuário sem permissão para retificar atendimentos';
  end if;

  select coalesce(jsonb_object_agg(key, value), '{}'::jsonb) into v_campos
  from jsonb_each(coalesce(p_campos, '{}'::jsonb))
  where key = any(v_editaveis);

  v_novo := jsonb_populate_record(v_atual, v_campos);

  if (select jsonb_object_agg(key, value) from jsonb_each(to_jsonb(v_novo)) where key = any(v_editaveis))
     is not distinct from
     (select jsonb_object_agg(key, value) from jsonb_each(to_jsonb(v_atual)) where key = any(v_editaveis)) then
    raise exception 'Nenhuma alteração encontrada';
  end if;

  insert into public.consulta_versoes (consulta_id, versao, dados, motivo, alterado_por, alterado_por_nome, aprovado_por, aprovado_por_nome)
  values (p_consulta, v_atual.versao, to_jsonb(v_atual), btrim(p_motivo), v_uid, coalesce(v_nome, ''), v_aprovador, coalesce(v_aprovador_nome, ''));

  perform set_config('app.retificando', 'on', true);

  update public.consultas set
    observacoes = v_novo.observacoes,
    diagnostico = v_novo.diagnostico,
    conduta = v_novo.conduta,
    diagnostico_zoonose_status = v_novo.diagnostico_zoonose_status,
    diagnostico_zoonose_observacoes = v_novo.diagnostico_zoonose_observacoes,
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
    versao = v_atual.versao + 1,
    retificado_em = now(),
    retificado_por = v_uid,
    retificado_por_nome = coalesce(v_nome, '')
  where id = p_consulta;

  perform set_config('app.retificando', 'off', true);

  if v_liberacao.id is not null then
    update public.liberacoes_atendimento
      set status = 'finalizada', finalizada_em = now()
      where id = v_liberacao.id;
  end if;

  return v_atual.versao + 1;
end;
$$;

revoke all on function public.envolvido_no_atendimento(integer) from public;
revoke all on function public.salvar_atendimento(integer, jsonb, jsonb, uuid[], boolean) from public;
revoke all on function public.descartar_atendimento(integer) from public;
revoke all on function public.atendimentos_em_andamento() from public;
grant execute on function public.envolvido_no_atendimento(integer) to authenticated;
grant execute on function public.salvar_atendimento(integer, jsonb, jsonb, uuid[], boolean) to authenticated;
grant execute on function public.descartar_atendimento(integer) to authenticated;
grant execute on function public.atendimentos_em_andamento() to authenticated;
