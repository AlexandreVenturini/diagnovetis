alter table public.liberacoes_atendimento drop constraint if exists liberacoes_atendimento_status_check;
alter table public.liberacoes_atendimento add constraint liberacoes_atendimento_status_check
  check (status in ('pendente', 'aberta', 'recusada', 'finalizada', 'cancelada'));

alter table public.liberacoes_atendimento
  add column if not exists metodo text not null default 'senha' check (metodo in ('senha', 'remota')),
  add column if not exists respondida_em timestamptz;

create or replace function public.solicitar_liberacao(p_supervisor uuid, p_participantes uuid[] default '{}')
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_aluno uuid := auth.uid();
  v_medico_id integer;
  v_liberacao uuid;
begin
  if public.meu_papel_aprovado() is distinct from 'attendant' then
    raise exception 'Apenas estudantes aprovados podem pedir liberação';
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

  insert into public.liberacoes_atendimento (aluno_id, supervisor_id, medico_id, participantes, status, metodo)
  values (
    v_aluno,
    p_supervisor,
    v_medico_id,
    coalesce((
      select array_agg(distinct p.id)
      from public.profiles p
      where p.id = any(coalesce(p_participantes, '{}')) and p.id <> v_aluno
        and p.role = 'attendant' and p.status = 'aprovado'
    ), '{}'),
    'pendente',
    'remota'
  )
  returning id into v_liberacao;

  return v_liberacao;
end;
$$;

create or replace function public.responder_liberacao(p_liberacao uuid, p_aprovar boolean)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_liberacao public.liberacoes_atendimento;
begin
  if public.meu_papel_aprovado() is distinct from 'veterinarian' then
    raise exception 'Apenas veterinários aprovados podem responder pedidos';
  end if;

  select * into v_liberacao from public.liberacoes_atendimento
    where id = p_liberacao and supervisor_id = auth.uid()
    for update;
  if v_liberacao.id is null then
    raise exception 'Pedido não encontrado';
  end if;
  if v_liberacao.status <> 'pendente' then
    raise exception 'Este pedido já foi respondido ou cancelado';
  end if;
  if v_liberacao.criada_em < now() - interval '30 minutes' then
    raise exception 'Pedido expirado';
  end if;

  update public.liberacoes_atendimento
    set status = case when p_aprovar then 'aberta' else 'recusada' end,
        respondida_em = now(),
        finalizada_em = case when p_aprovar then null else now() end
    where id = p_liberacao;
end;
$$;

create or replace function public.pedidos_liberacao_pendentes()
returns table (id uuid, aluno_nome text, aluno_matricula text, participantes text[], criada_em timestamptz)
language sql stable security definer set search_path = public as $$
  select l.id, a.name, a.matricula,
    coalesce((select array_agg(p.name order by p.name) from public.profiles p where p.id = any(l.participantes)), '{}'),
    l.criada_em
  from public.liberacoes_atendimento l
  join public.profiles a on a.id = l.aluno_id
  where l.supervisor_id = auth.uid() and l.status = 'pendente'
    and l.criada_em > now() - interval '30 minutes'
    and public.meu_papel_aprovado() = 'veterinarian'
  order by l.criada_em;
$$;

create or replace function public.cancelar_liberacao(p_liberacao uuid)
returns void language sql security definer set search_path = public as $$
  update public.liberacoes_atendimento
    set status = 'cancelada', finalizada_em = now()
    where id = p_liberacao and aluno_id = auth.uid() and status in ('aberta', 'pendente');
$$;

revoke all on function public.solicitar_liberacao(uuid, uuid[]) from public;
revoke all on function public.responder_liberacao(uuid, boolean) from public;
revoke all on function public.pedidos_liberacao_pendentes() from public;
grant execute on function public.solicitar_liberacao(uuid, uuid[]) to authenticated;
grant execute on function public.responder_liberacao(uuid, boolean) to authenticated;
grant execute on function public.pedidos_liberacao_pendentes() to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'liberacoes_atendimento'
  ) then
    alter publication supabase_realtime add table public.liberacoes_atendimento;
  end if;
end;
$$;

notify pgrst, 'reload schema';
