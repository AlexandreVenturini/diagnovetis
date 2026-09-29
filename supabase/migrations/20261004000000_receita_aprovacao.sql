alter table public.prescricoes
  add column if not exists montada_por uuid references public.profiles(id) on delete set null,
  add column if not exists aprovada_por uuid references public.profiles(id) on delete set null;

drop policy if exists prescricoes_insert on public.prescricoes;
create policy prescricoes_insert on public.prescricoes for insert to authenticated
  with check (created_by = auth.uid() and public.meu_papel_aprovado() = 'veterinarian');

alter table public.liberacoes_atendimento drop constraint if exists liberacoes_atendimento_tipo_check;
alter table public.liberacoes_atendimento add constraint liberacoes_atendimento_tipo_check
  check (tipo in ('atendimento', 'retificacao', 'receita'));

alter table public.liberacoes_atendimento
  add column if not exists receita_pet_id integer references public.pets(id) on delete cascade,
  add column if not exists receita_dados jsonb,
  add column if not exists prescricao_id uuid references public.prescricoes(id) on delete set null,
  add column if not exists motivo_recusa text;

create or replace function public.emitir_receita_interna(p_liberacao uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_liberacao public.liberacoes_atendimento;
  v_medico public.medicos;
  v_snapshot jsonb;
  v_prescricao uuid := gen_random_uuid();
begin
  select * into v_liberacao from public.liberacoes_atendimento where id = p_liberacao for update;
  if v_liberacao.prescricao_id is not null then
    return v_liberacao.prescricao_id;
  end if;
  if v_liberacao.tipo <> 'receita' or v_liberacao.receita_dados is null or v_liberacao.receita_pet_id is null then
    raise exception 'Pedido de receita inválido';
  end if;

  select * into v_medico from public.medicos where id = v_liberacao.medico_id;

  v_snapshot := v_liberacao.receita_dados;
  v_snapshot := jsonb_set(v_snapshot, '{version}', '1'::jsonb);
  v_snapshot := jsonb_set(v_snapshot, '{issuedAt}', to_jsonb(to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')));
  v_snapshot := jsonb_set(v_snapshot, '{patient,veterinarian}', to_jsonb(v_medico.nome));
  v_snapshot := jsonb_set(v_snapshot, '{prescription,crmv}', to_jsonb(v_medico.crmv));

  insert into public.prescricoes (id, pet_id, veterinario_id, snapshot, created_by, montada_por, aprovada_por)
  values (v_prescricao, v_liberacao.receita_pet_id, v_liberacao.medico_id, v_snapshot, v_liberacao.supervisor_id, v_liberacao.aluno_id, v_liberacao.supervisor_id);

  update public.liberacoes_atendimento
    set status = 'finalizada', prescricao_id = v_prescricao, finalizada_em = now(), respondida_em = coalesce(respondida_em, now())
    where id = p_liberacao;

  return v_prescricao;
end;
$$;

revoke all on function public.emitir_receita_interna(uuid) from public;

create or replace function public.emitir_receita(p_liberacao uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_liberacao public.liberacoes_atendimento;
begin
  select * into v_liberacao from public.liberacoes_atendimento
    where id = p_liberacao and aluno_id = auth.uid() and tipo = 'receita';
  if v_liberacao.id is null then
    raise exception 'Pedido de receita não encontrado';
  end if;
  if v_liberacao.prescricao_id is not null then
    return v_liberacao.prescricao_id;
  end if;
  if v_liberacao.status <> 'aberta' then
    raise exception 'Receita ainda não aprovada pelo veterinário';
  end if;
  return public.emitir_receita_interna(p_liberacao);
end;
$$;

drop function if exists public.liberar_atendimento(uuid, text, uuid[], integer);
create or replace function public.liberar_atendimento(
  p_supervisor uuid, p_senha text, p_participantes uuid[] default '{}', p_consulta integer default null,
  p_receita_pet integer default null, p_receita_dados jsonb default null
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_aluno uuid := auth.uid();
  v_medico_id integer;
  v_senha_ok boolean;
  v_liberacao uuid;
  v_tipo text := case when p_receita_dados is not null then 'receita' when p_consulta is not null then 'retificacao' else 'atendimento' end;
begin
  if public.meu_papel_aprovado() is distinct from 'attendant' then
    raise exception 'Apenas estudantes aprovados precisam de liberação';
  end if;
  if v_tipo = 'retificacao' and not exists (select 1 from public.consultas where id = p_consulta) then
    raise exception 'Atendimento não encontrado';
  end if;
  if v_tipo = 'receita' and not exists (select 1 from public.pets where id = p_receita_pet) then
    raise exception 'Animal não encontrado';
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

  insert into public.liberacoes_atendimento (aluno_id, supervisor_id, medico_id, participantes, tipo, consulta_alvo, receita_pet_id, receita_dados)
  values (
    v_aluno,
    p_supervisor,
    v_medico_id,
    case when v_tipo = 'atendimento' then coalesce((
      select array_agg(distinct p.id)
      from public.profiles p
      where p.id = any(coalesce(p_participantes, '{}')) and p.id <> v_aluno
        and p.role = 'attendant' and p.status = 'aprovado'
    ), '{}') else '{}' end,
    v_tipo,
    case when v_tipo = 'retificacao' then p_consulta end,
    case when v_tipo = 'receita' then p_receita_pet end,
    case when v_tipo = 'receita' then p_receita_dados end
  )
  returning id into v_liberacao;

  return v_liberacao;
end;
$$;

drop function if exists public.solicitar_liberacao(uuid, uuid[], integer);
create or replace function public.solicitar_liberacao(
  p_supervisor uuid, p_participantes uuid[] default '{}', p_consulta integer default null,
  p_receita_pet integer default null, p_receita_dados jsonb default null
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_aluno uuid := auth.uid();
  v_medico_id integer;
  v_liberacao uuid;
  v_tipo text := case when p_receita_dados is not null then 'receita' when p_consulta is not null then 'retificacao' else 'atendimento' end;
begin
  if public.meu_papel_aprovado() is distinct from 'attendant' then
    raise exception 'Apenas estudantes aprovados podem pedir liberação';
  end if;
  if v_tipo = 'retificacao' and not exists (select 1 from public.consultas where id = p_consulta) then
    raise exception 'Atendimento não encontrado';
  end if;
  if v_tipo = 'receita' and not exists (select 1 from public.pets where id = p_receita_pet) then
    raise exception 'Animal não encontrado';
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
    where aluno_id = v_aluno and status = 'pendente' and tipo = v_tipo;

  insert into public.liberacoes_atendimento (aluno_id, supervisor_id, medico_id, participantes, status, metodo, tipo, consulta_alvo, receita_pet_id, receita_dados)
  values (
    v_aluno,
    p_supervisor,
    v_medico_id,
    case when v_tipo = 'atendimento' then coalesce((
      select array_agg(distinct p.id)
      from public.profiles p
      where p.id = any(coalesce(p_participantes, '{}')) and p.id <> v_aluno
        and p.role = 'attendant' and p.status = 'aprovado'
    ), '{}') else '{}' end,
    'pendente',
    'remota',
    v_tipo,
    case when v_tipo = 'retificacao' then p_consulta end,
    case when v_tipo = 'receita' then p_receita_pet end,
    case when v_tipo = 'receita' then p_receita_dados end
  )
  returning id into v_liberacao;

  return v_liberacao;
end;
$$;

drop function if exists public.responder_liberacao(uuid, boolean);
create or replace function public.responder_liberacao(p_liberacao uuid, p_aprovar boolean, p_motivo text default null)
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

  if not p_aprovar then
    update public.liberacoes_atendimento
      set status = 'recusada', respondida_em = now(), finalizada_em = now(), motivo_recusa = nullif(btrim(coalesce(p_motivo, '')), '')
      where id = p_liberacao;
    return;
  end if;

  update public.liberacoes_atendimento
    set status = 'aberta', respondida_em = now(), finalizada_em = null
    where id = p_liberacao;

  if v_liberacao.tipo = 'receita' then
    perform public.emitir_receita_interna(p_liberacao);
  end if;
end;
$$;

drop function if exists public.pedidos_liberacao_pendentes();
create or replace function public.pedidos_liberacao_pendentes()
returns table (id uuid, aluno_nome text, aluno_matricula text, participantes text[], criada_em timestamptz, tipo text, consulta_alvo integer, paciente text, receita_dados jsonb)
language sql stable security definer set search_path = public as $$
  select l.id, a.name, a.matricula,
    coalesce((select array_agg(p.name order by p.name) from public.profiles p where p.id = any(l.participantes)), '{}'),
    l.criada_em, l.tipo, l.consulta_alvo,
    coalesce(
      (select pt.nome from public.consultas c join public.pets pt on pt.id = c.pet_id where c.id = l.consulta_alvo),
      (select pt.nome from public.pets pt where pt.id = l.receita_pet_id)
    ),
    l.receita_dados
  from public.liberacoes_atendimento l
  join public.profiles a on a.id = l.aluno_id
  where l.supervisor_id = auth.uid() and l.status = 'pendente'
    and l.criada_em > now() - interval '30 minutes'
    and public.meu_papel_aprovado() = 'veterinarian'
  order by l.criada_em;
$$;

revoke all on function public.emitir_receita(uuid) from public;
revoke all on function public.liberar_atendimento(uuid, text, uuid[], integer, integer, jsonb) from public;
revoke all on function public.solicitar_liberacao(uuid, uuid[], integer, integer, jsonb) from public;
revoke all on function public.responder_liberacao(uuid, boolean, text) from public;
revoke all on function public.pedidos_liberacao_pendentes() from public;
grant execute on function public.emitir_receita(uuid) to authenticated;
grant execute on function public.liberar_atendimento(uuid, text, uuid[], integer, integer, jsonb) to authenticated;
grant execute on function public.solicitar_liberacao(uuid, uuid[], integer, integer, jsonb) to authenticated;
grant execute on function public.responder_liberacao(uuid, boolean, text) to authenticated;
grant execute on function public.pedidos_liberacao_pendentes() to authenticated;

notify pgrst, 'reload schema';
