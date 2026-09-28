create table if not exists public.liberacoes_atendimento (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.profiles(id) on delete cascade,
  supervisor_id uuid not null references public.profiles(id) on delete cascade,
  medico_id integer not null references public.medicos(id),
  participantes uuid[] not null default '{}',
  status text not null default 'aberta' check (status in ('aberta', 'finalizada', 'cancelada')),
  consulta_id integer references public.consultas(id) on delete set null,
  criada_em timestamptz not null default now(),
  finalizada_em timestamptz
);

create table if not exists public.tentativas_liberacao (
  id bigint generated always as identity primary key,
  aluno_id uuid not null references public.profiles(id) on delete cascade,
  supervisor_id uuid not null references public.profiles(id) on delete cascade,
  criada_em timestamptz not null default now()
);

create table if not exists public.consulta_participantes (
  consulta_id integer not null references public.consultas(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  papel text not null check (papel in ('registrou', 'participante', 'supervisor')),
  nome text not null default '',
  primary key (consulta_id, profile_id)
);

alter table public.consultas
  add column if not exists registrado_por uuid references public.profiles(id) on delete set null,
  add column if not exists supervisor_id uuid references public.profiles(id) on delete set null,
  add column if not exists liberacao_id uuid references public.liberacoes_atendimento(id) on delete set null;

alter table public.liberacoes_atendimento enable row level security;
alter table public.tentativas_liberacao enable row level security;
alter table public.consulta_participantes enable row level security;

drop policy if exists liberacoes_select on public.liberacoes_atendimento;
create policy liberacoes_select on public.liberacoes_atendimento for select to authenticated
  using (aluno_id = auth.uid() or supervisor_id = auth.uid() or auth.uid() = any(participantes) or public.is_admin());

drop policy if exists consulta_participantes_select on public.consulta_participantes;
create policy consulta_participantes_select on public.consulta_participantes for select to authenticated
  using (true);

create or replace function public.meu_papel_aprovado()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and status = 'aprovado';
$$;

create or replace function public.veterinarios_disponiveis()
returns table (profile_id uuid, medico_id integer, nome text, crmv text, email text)
language sql stable security definer set search_path = public as $$
  select p.id, m.id, m.nome, m.crmv, p.email
  from public.profiles p
  join public.medicos m on lower(m.email) = lower(p.email)
  where p.role = 'veterinarian' and p.status = 'aprovado' and public.meu_papel_aprovado() is not null
  order by m.nome;
$$;

create or replace function public.estudantes_disponiveis()
returns table (profile_id uuid, nome text, matricula text)
language sql stable security definer set search_path = public as $$
  select p.id, p.name, p.matricula
  from public.profiles p
  where p.role = 'attendant' and p.status = 'aprovado' and p.id <> auth.uid()
    and public.meu_papel_aprovado() is not null
  order by p.name;
$$;

create or replace function public.liberar_atendimento(p_supervisor uuid, p_senha text, p_participantes uuid[] default '{}')
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

  insert into public.liberacoes_atendimento (aluno_id, supervisor_id, medico_id, participantes)
  values (
    v_aluno,
    p_supervisor,
    v_medico_id,
    coalesce((
      select array_agg(distinct p.id)
      from public.profiles p
      where p.id = any(coalesce(p_participantes, '{}')) and p.id <> v_aluno
        and p.role = 'attendant' and p.status = 'aprovado'
    ), '{}')
  )
  returning id into v_liberacao;

  return v_liberacao;
end;
$$;

create or replace function public.cancelar_liberacao(p_liberacao uuid)
returns void language sql security definer set search_path = public as $$
  update public.liberacoes_atendimento
    set status = 'cancelada', finalizada_em = now()
    where id = p_liberacao and aluno_id = auth.uid() and status = 'aberta';
$$;

revoke all on function public.meu_papel_aprovado() from public;
revoke all on function public.veterinarios_disponiveis() from public;
revoke all on function public.estudantes_disponiveis() from public;
revoke all on function public.liberar_atendimento(uuid, text, uuid[]) from public;
revoke all on function public.cancelar_liberacao(uuid) from public;
grant execute on function public.meu_papel_aprovado() to authenticated;
grant execute on function public.veterinarios_disponiveis() to authenticated;
grant execute on function public.estudantes_disponiveis() to authenticated;
grant execute on function public.liberar_atendimento(uuid, text, uuid[]) to authenticated;
grant execute on function public.cancelar_liberacao(uuid) to authenticated;

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

  if v_papel = 'veterinarian' then
    new.supervisor_id := v_uid;
    new.liberacao_id := null;
    return new;
  end if;

  if v_papel = 'attendant' then
    select * into v_liberacao from public.liberacoes_atendimento
      where id = new.liberacao_id and aluno_id = v_uid and status = 'aberta';
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

create or replace function public.registrar_participantes_consulta()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_participantes uuid[] := '{}';
begin
  if new.registrado_por is null then
    return new;
  end if;

  if new.liberacao_id is not null then
    update public.liberacoes_atendimento
      set status = 'finalizada', consulta_id = new.id, finalizada_em = now()
      where id = new.liberacao_id
      returning participantes into v_participantes;
  end if;

  insert into public.consulta_participantes (consulta_id, profile_id, papel, nome)
  select new.id, p.id,
    case when p.id = new.registrado_por then 'registrou' when p.id = new.supervisor_id then 'supervisor' else 'participante' end,
    p.name
  from public.profiles p
  where p.id = new.registrado_por or p.id = new.supervisor_id or p.id = any(coalesce(v_participantes, '{}'))
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists consultas_validar_supervisao on public.consultas;
create trigger consultas_validar_supervisao
  before insert on public.consultas
  for each row execute function public.validar_supervisao_consulta();

drop trigger if exists consultas_registrar_participantes on public.consultas;
create trigger consultas_registrar_participantes
  after insert on public.consultas
  for each row execute function public.registrar_participantes_consulta();

notify pgrst, 'reload schema';
