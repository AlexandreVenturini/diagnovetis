alter table public.consultas
  add column if not exists versao integer not null default 1,
  add column if not exists retificado_em timestamptz,
  add column if not exists retificado_por uuid references public.profiles(id) on delete set null,
  add column if not exists retificado_por_nome text;

create table if not exists public.consulta_versoes (
  id bigint generated always as identity primary key,
  consulta_id integer not null references public.consultas(id) on delete cascade,
  versao integer not null,
  dados jsonb not null,
  motivo text not null,
  alterado_por uuid references public.profiles(id) on delete set null,
  alterado_por_nome text not null default '',
  aprovado_por uuid references public.profiles(id) on delete set null,
  aprovado_por_nome text not null default '',
  alterado_em timestamptz not null default now(),
  unique (consulta_id, versao)
);

alter table public.consulta_versoes enable row level security;

drop policy if exists consulta_versoes_select on public.consulta_versoes;
create policy consulta_versoes_select on public.consulta_versoes for select to authenticated
  using (true);

alter table public.liberacoes_atendimento
  add column if not exists tipo text not null default 'atendimento' check (tipo in ('atendimento', 'retificacao')),
  add column if not exists consulta_alvo integer references public.consultas(id) on delete cascade;

create or replace function public.validar_supervisao_consulta()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_papel text;
  v_liberacao public.liberacoes_atendimento;
begin
  if v_uid is null then
    if auth.role() = 'anon' then
      raise exception 'É necessário estar logado para registrar atendimentos';
    end if;
    return new;
  end if;

  v_papel := public.meu_papel_aprovado();
  new.registrado_por := v_uid;
  new.versao := 1;
  new.retificado_em := null;
  new.retificado_por := null;
  new.retificado_por_nome := null;

  if v_papel = 'veterinarian' then
    new.supervisor_id := v_uid;
    new.liberacao_id := null;
    return new;
  end if;

  if v_papel = 'attendant' then
    select * into v_liberacao from public.liberacoes_atendimento
      where id = new.liberacao_id and aluno_id = v_uid and status = 'aberta' and tipo = 'atendimento';
    if v_liberacao.id is null then
      raise exception 'Atendimento sem liberação válida do professor supervisor';
    end if;
    new.supervisor_id := v_liberacao.supervisor_id;
    new.responsavel_id := v_liberacao.medico_id;
    return new;
  end if;

  raise exception 'Usuário sem permissão para registrar atendimentos';
end;
$$;

drop function if exists public.liberar_atendimento(uuid, text, uuid[]);
create or replace function public.liberar_atendimento(p_supervisor uuid, p_senha text, p_participantes uuid[] default '{}', p_consulta integer default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_aluno uuid := auth.uid();
  v_medico_id integer;
  v_senha_ok boolean;
  v_liberacao uuid;
begin
  if public.meu_papel_aprovado() is distinct from 'attendant' then
    raise exception 'Apenas estudantes aprovados precisam de liberação';
  end if;
  if p_consulta is not null and not exists (select 1 from public.consultas where id = p_consulta) then
    raise exception 'Atendimento não encontrado';
  end if;

  select m.id into v_medico_id
  from public.profiles p
  join public.medicos m on lower(m.email) = lower(p.email)
  where p.id = p_supervisor and p.role = 'veterinarian' and p.status = 'aprovado';
  if v_medico_id is null then
    raise exception 'Supervisor inválido';
  end if;

  if (select count(*) from public.tentativas_liberacao
      where aluno_id = v_aluno and supervisor_id = p_supervisor and criada_em > now() - interval '15 minutes') >= 5 then
    raise exception 'Muitas tentativas com senha incorreta. Aguarde 15 minutos.';
  end if;

  select u.encrypted_password = extensions.crypt(p_senha, u.encrypted_password) into v_senha_ok
  from auth.users u where u.id = p_supervisor;

  if not coalesce(v_senha_ok, false) then
    insert into public.tentativas_liberacao (aluno_id, supervisor_id) values (v_aluno, p_supervisor);
    return null;
  end if;

  delete from public.tentativas_liberacao where aluno_id = v_aluno and supervisor_id = p_supervisor;

  insert into public.liberacoes_atendimento (aluno_id, supervisor_id, medico_id, participantes, tipo, consulta_alvo)
  values (
    v_aluno,
    p_supervisor,
    v_medico_id,
    case when p_consulta is null then coalesce((
      select array_agg(distinct p.id)
      from public.profiles p
      where p.id = any(coalesce(p_participantes, '{}')) and p.id <> v_aluno
        and p.role = 'attendant' and p.status = 'aprovado'
    ), '{}') else '{}' end,
    case when p_consulta is null then 'atendimento' else 'retificacao' end,
    p_consulta
  )
  returning id into v_liberacao;

  return v_liberacao;
end;
$$;

drop function if exists public.solicitar_liberacao(uuid, uuid[]);
create or replace function public.solicitar_liberacao(p_supervisor uuid, p_participantes uuid[] default '{}', p_consulta integer default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_aluno uuid := auth.uid();
  v_medico_id integer;
  v_liberacao uuid;
begin
  if public.meu_papel_aprovado() is distinct from 'attendant' then
    raise exception 'Apenas estudantes aprovados podem pedir liberação';
  end if;
  if p_consulta is not null and not exists (select 1 from public.consultas where id = p_consulta) then
    raise exception 'Atendimento não encontrado';
  end if;

  select m.id into v_medico_id
  from public.profiles p
  join public.medicos m on lower(m.email) = lower(p.email)
  where p.id = p_supervisor and p.role = 'veterinarian' and p.status = 'aprovado';
  if v_medico_id is null then
    raise exception 'Supervisor inválido';
  end if;

  update public.liberacoes_atendimento
    set status = 'cancelada', finalizada_em = now()
    where aluno_id = v_aluno and status = 'pendente';

  insert into public.liberacoes_atendimento (aluno_id, supervisor_id, medico_id, participantes, status, metodo, tipo, consulta_alvo)
  values (
    v_aluno,
    p_supervisor,
    v_medico_id,
    case when p_consulta is null then coalesce((
      select array_agg(distinct p.id)
      from public.profiles p
      where p.id = any(coalesce(p_participantes, '{}')) and p.id <> v_aluno
        and p.role = 'attendant' and p.status = 'aprovado'
    ), '{}') else '{}' end,
    'pendente',
    'remota',
    case when p_consulta is null then 'atendimento' else 'retificacao' end,
    p_consulta
  )
  returning id into v_liberacao;

  return v_liberacao;
end;
$$;

drop function if exists public.pedidos_liberacao_pendentes();
create or replace function public.pedidos_liberacao_pendentes()
returns table (id uuid, aluno_nome text, aluno_matricula text, participantes text[], criada_em timestamptz, tipo text, consulta_alvo integer, paciente text)
language sql stable security definer set search_path = public as $$
  select l.id, a.name, a.matricula,
    coalesce((select array_agg(p.name order by p.name) from public.profiles p where p.id = any(l.participantes)), '{}'),
    l.criada_em, l.tipo, l.consulta_alvo,
    (select pt.nome from public.consultas c join public.pets pt on pt.id = c.pet_id where c.id = l.consulta_alvo)
  from public.liberacoes_atendimento l
  join public.profiles a on a.id = l.aluno_id
  where l.supervisor_id = auth.uid() and l.status = 'pendente'
    and l.criada_em > now() - interval '30 minutes'
    and public.meu_papel_aprovado() = 'veterinarian'
  order by l.criada_em;
$$;

revoke all on function public.liberar_atendimento(uuid, text, uuid[], integer) from public;
revoke all on function public.solicitar_liberacao(uuid, uuid[], integer) from public;
revoke all on function public.pedidos_liberacao_pendentes() from public;
grant execute on function public.liberar_atendimento(uuid, text, uuid[], integer) to authenticated;
grant execute on function public.solicitar_liberacao(uuid, uuid[], integer) to authenticated;
grant execute on function public.pedidos_liberacao_pendentes() to authenticated;

create or replace function public.retificar_consulta(p_consulta integer, p_campos jsonb, p_motivo text, p_liberacao uuid default null)
returns integer language plpgsql security definer set search_path = public as $$
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

revoke all on function public.retificar_consulta(integer, jsonb, text, uuid) from public;
grant execute on function public.retificar_consulta(integer, jsonb, text, uuid) to authenticated;

create or replace function public.bloquear_edicao_direta_consulta()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null and coalesce(auth.role(), '') <> 'anon' then
    return coalesce(new, old);
  end if;

  if tg_op = 'DELETE' then
    if public.is_admin() then
      return old;
    end if;
    raise exception 'Atendimentos não podem ser excluídos';
  end if;

  if coalesce(current_setting('app.retificando', true), '') = 'on' then
    return new;
  end if;

  if (to_jsonb(new) - array['registrado_por', 'supervisor_id', 'liberacao_id', 'retificado_por'])
     = (to_jsonb(old) - array['registrado_por', 'supervisor_id', 'liberacao_id', 'retificado_por']) then
    return new;
  end if;

  raise exception 'Atendimentos finalizados só podem ser alterados por retificação';
end;
$$;

drop trigger if exists consultas_bloquear_edicao on public.consultas;
create trigger consultas_bloquear_edicao
  before update or delete on public.consultas
  for each row execute function public.bloquear_edicao_direta_consulta();

notify pgrst, 'reload schema';
