create table if not exists public.obitos (
  id bigint generated always as identity primary key,
  pet_id integer not null unique references public.pets(id) on delete cascade,
  consulta_id integer references public.consultas(id) on delete set null,
  data_hora timestamptz not null,
  circunstancias text not null,
  causa_provavel text not null default '',
  houve_reanimacao boolean not null default false,
  eutanasia boolean not null default false,
  medico_responsavel_id integer references public.medicos(id),
  medico_responsavel_nome text not null default '',
  comunicado_responsavel boolean not null default false,
  comunicacao_detalhes text not null default '',
  necropsia boolean not null default false,
  destino_corpo text not null,
  registrado_por uuid references public.profiles(id) on delete set null,
  registrado_por_nome text not null default '',
  aprovado_por uuid references public.profiles(id) on delete set null,
  aprovado_por_nome text not null default '',
  registrado_em timestamptz not null default now(),
  versao integer not null default 1,
  retificado_em timestamptz,
  retificado_por_nome text
);

create table if not exists public.obito_versoes (
  id bigint generated always as identity primary key,
  obito_id bigint not null references public.obitos(id) on delete cascade,
  versao integer not null,
  dados jsonb not null,
  motivo text not null,
  alterado_por uuid references public.profiles(id) on delete set null,
  alterado_por_nome text not null default '',
  alterado_em timestamptz not null default now(),
  unique (obito_id, versao)
);

alter table public.pets add column if not exists obito_em timestamptz;

alter table public.obitos enable row level security;
alter table public.obito_versoes enable row level security;

drop policy if exists obitos_select on public.obitos;
create policy obitos_select on public.obitos for select to authenticated using (true);
drop policy if exists obito_versoes_select on public.obito_versoes;
create policy obito_versoes_select on public.obito_versoes for select to authenticated using (true);

alter table public.liberacoes_atendimento drop constraint if exists liberacoes_atendimento_tipo_check;
alter table public.liberacoes_atendimento add constraint liberacoes_atendimento_tipo_check
  check (tipo in ('atendimento', 'retificacao', 'receita', 'obito'));

alter table public.liberacoes_atendimento
  add column if not exists pet_alvo integer references public.pets(id) on delete cascade,
  add column if not exists dados_pedido jsonb,
  add column if not exists obito_id bigint references public.obitos(id) on delete set null;

create or replace function public.pet_em_obito(p_pet integer)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.obitos where pet_id = p_pet);
$$;

create or replace function public.registrar_obito_interno(p_pet integer, p_dados jsonb, p_registrado_por uuid, p_aprovado_por uuid)
returns bigint language plpgsql security definer set search_path = public as $$
declare
  v_data timestamptz;
  v_medico public.medicos;
  v_obito bigint;
  v_consulta integer := nullif(p_dados->>'consulta_id', '')::integer;
begin
  if not exists (select 1 from public.pets where id = p_pet) then
    raise exception 'Animal não encontrado';
  end if;
  if public.pet_em_obito(p_pet) then
    raise exception 'Este animal já tem óbito registrado';
  end if;

  v_data := nullif(p_dados->>'data_hora', '')::timestamptz;
  if v_data is null then
    raise exception 'Informe a data e a hora do óbito';
  end if;
  if v_data > now() + interval '5 minutes' then
    raise exception 'A data do óbito não pode estar no futuro';
  end if;
  if nullif(btrim(coalesce(p_dados->>'circunstancias', '')), '') is null then
    raise exception 'Descreva as circunstâncias do óbito';
  end if;
  if nullif(btrim(coalesce(p_dados->>'destino_corpo', '')), '') is null then
    raise exception 'Informe a destinação do corpo';
  end if;

  select * into v_medico from public.medicos where id = nullif(p_dados->>'medico_responsavel_id', '')::integer;
  if v_medico.id is null then
    raise exception 'Informe o profissional responsável';
  end if;
  if v_consulta is not null and not exists (select 1 from public.consultas where id = v_consulta and pet_id = p_pet) then
    v_consulta := null;
  end if;

  insert into public.obitos (
    pet_id, consulta_id, data_hora, circunstancias, causa_provavel, houve_reanimacao, eutanasia,
    medico_responsavel_id, medico_responsavel_nome, comunicado_responsavel, comunicacao_detalhes,
    necropsia, destino_corpo, registrado_por, registrado_por_nome, aprovado_por, aprovado_por_nome
  ) values (
    p_pet, v_consulta, v_data, btrim(p_dados->>'circunstancias'), btrim(coalesce(p_dados->>'causa_provavel', '')),
    coalesce((p_dados->>'houve_reanimacao')::boolean, false), coalesce((p_dados->>'eutanasia')::boolean, false),
    v_medico.id, v_medico.nome, coalesce((p_dados->>'comunicado_responsavel')::boolean, false),
    btrim(coalesce(p_dados->>'comunicacao_detalhes', '')), coalesce((p_dados->>'necropsia')::boolean, false),
    btrim(p_dados->>'destino_corpo'),
    p_registrado_por, coalesce((select name from public.profiles where id = p_registrado_por), ''),
    p_aprovado_por, coalesce((select name from public.profiles where id = p_aprovado_por), '')
  )
  returning id into v_obito;

  update public.pets set obito_em = v_data where id = p_pet;
  return v_obito;
end;
$$;

revoke all on function public.registrar_obito_interno(integer, jsonb, uuid, uuid) from public;

create or replace function public.registrar_obito(p_pet integer, p_dados jsonb)
returns bigint language plpgsql security definer set search_path = public as $$
begin
  if public.meu_papel_aprovado() is distinct from 'veterinarian' then
    raise exception 'Estudantes registram óbito com aprovação de um veterinário';
  end if;
  return public.registrar_obito_interno(p_pet, p_dados, auth.uid(), auth.uid());
end;
$$;

create or replace function public.registrar_obito_da_liberacao(p_liberacao uuid)
returns bigint language plpgsql security definer set search_path = public as $$
declare
  v_liberacao public.liberacoes_atendimento;
  v_obito bigint;
begin
  select * into v_liberacao from public.liberacoes_atendimento where id = p_liberacao for update;
  if v_liberacao.obito_id is not null then
    return v_liberacao.obito_id;
  end if;
  if v_liberacao.tipo <> 'obito' or v_liberacao.pet_alvo is null or v_liberacao.dados_pedido is null then
    raise exception 'Pedido de registro de óbito inválido';
  end if;

  v_obito := public.registrar_obito_interno(v_liberacao.pet_alvo, v_liberacao.dados_pedido, v_liberacao.aluno_id, v_liberacao.supervisor_id);

  update public.liberacoes_atendimento
    set status = 'finalizada', obito_id = v_obito, finalizada_em = now(), respondida_em = coalesce(respondida_em, now())
    where id = p_liberacao;
  return v_obito;
end;
$$;

revoke all on function public.registrar_obito_da_liberacao(uuid) from public;

create or replace function public.registrar_obito_liberado(p_liberacao uuid)
returns bigint language plpgsql security definer set search_path = public as $$
declare
  v_liberacao public.liberacoes_atendimento;
begin
  select * into v_liberacao from public.liberacoes_atendimento
    where id = p_liberacao and aluno_id = auth.uid() and tipo = 'obito';
  if v_liberacao.id is null then
    raise exception 'Pedido de registro de óbito não encontrado';
  end if;
  if v_liberacao.obito_id is not null then
    return v_liberacao.obito_id;
  end if;
  if v_liberacao.status <> 'aberta' then
    raise exception 'Registro de óbito ainda não aprovado pelo veterinário';
  end if;
  return public.registrar_obito_da_liberacao(p_liberacao);
end;
$$;

create or replace function public.retificar_obito(p_obito bigint, p_dados jsonb, p_motivo text)
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_atual public.obitos;
  v_medico public.medicos;
  v_nome text;
  v_data timestamptz;
begin
  if public.meu_papel_aprovado() is distinct from 'veterinarian' then
    raise exception 'Apenas veterinários podem retificar o registro de óbito';
  end if;
  if nullif(btrim(coalesce(p_motivo, '')), '') is null then
    raise exception 'Informe o motivo da retificação';
  end if;

  select * into v_atual from public.obitos where id = p_obito for update;
  if v_atual.id is null then
    raise exception 'Registro de óbito não encontrado';
  end if;

  v_data := coalesce(nullif(p_dados->>'data_hora', '')::timestamptz, v_atual.data_hora);
  if v_data > now() + interval '5 minutes' then
    raise exception 'A data do óbito não pode estar no futuro';
  end if;
  if nullif(btrim(coalesce(p_dados->>'circunstancias', v_atual.circunstancias)), '') is null
     or nullif(btrim(coalesce(p_dados->>'destino_corpo', v_atual.destino_corpo)), '') is null then
    raise exception 'Circunstâncias e destinação do corpo são obrigatórias';
  end if;

  select * into v_medico from public.medicos
    where id = coalesce(nullif(p_dados->>'medico_responsavel_id', '')::integer, v_atual.medico_responsavel_id);
  select name into v_nome from public.profiles where id = auth.uid();

  insert into public.obito_versoes (obito_id, versao, dados, motivo, alterado_por, alterado_por_nome)
  values (p_obito, v_atual.versao, to_jsonb(v_atual), btrim(p_motivo), auth.uid(), coalesce(v_nome, ''));

  update public.obitos set
    data_hora = v_data,
    circunstancias = btrim(coalesce(p_dados->>'circunstancias', circunstancias)),
    causa_provavel = btrim(coalesce(p_dados->>'causa_provavel', causa_provavel)),
    houve_reanimacao = coalesce((p_dados->>'houve_reanimacao')::boolean, houve_reanimacao),
    eutanasia = coalesce((p_dados->>'eutanasia')::boolean, eutanasia),
    medico_responsavel_id = coalesce(v_medico.id, medico_responsavel_id),
    medico_responsavel_nome = coalesce(v_medico.nome, medico_responsavel_nome),
    comunicado_responsavel = coalesce((p_dados->>'comunicado_responsavel')::boolean, comunicado_responsavel),
    comunicacao_detalhes = btrim(coalesce(p_dados->>'comunicacao_detalhes', comunicacao_detalhes)),
    necropsia = coalesce((p_dados->>'necropsia')::boolean, necropsia),
    destino_corpo = btrim(coalesce(p_dados->>'destino_corpo', destino_corpo)),
    versao = v_atual.versao + 1,
    retificado_em = now(),
    retificado_por_nome = coalesce(v_nome, '')
  where id = p_obito;

  update public.pets set obito_em = v_data where id = v_atual.pet_id;
  return v_atual.versao + 1;
end;
$$;

create or replace function public.bloquear_pet_em_obito()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_pet integer := case tg_table_name
    when 'agendamentos' then (to_jsonb(new)->>'dog_id')::integer
    else (to_jsonb(new)->>'pet_id')::integer
  end;
begin
  if v_pet is not null and public.pet_em_obito(v_pet) then
    raise exception 'Animal com óbito registrado: não é possível criar novos registros para ele';
  end if;
  return new;
end;
$$;

drop trigger if exists consultas_bloquear_obito on public.consultas;
create trigger consultas_bloquear_obito before insert on public.consultas
  for each row execute function public.bloquear_pet_em_obito();
drop trigger if exists prescricoes_bloquear_obito on public.prescricoes;
create trigger prescricoes_bloquear_obito before insert on public.prescricoes
  for each row execute function public.bloquear_pet_em_obito();
drop trigger if exists agendamentos_bloquear_obito on public.agendamentos;
create trigger agendamentos_bloquear_obito before insert on public.agendamentos
  for each row execute function public.bloquear_pet_em_obito();

drop function if exists public.liberar_atendimento(uuid, text, uuid[], integer, integer, jsonb);
create or replace function public.liberar_atendimento(
  p_supervisor uuid, p_senha text, p_participantes uuid[] default '{}', p_consulta integer default null,
  p_receita_pet integer default null, p_receita_dados jsonb default null,
  p_tipo text default null, p_pet_alvo integer default null, p_dados jsonb default null
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_aluno uuid := auth.uid();
  v_medico_id integer;
  v_senha_ok boolean;
  v_liberacao uuid;
  v_tipo text := case when p_tipo = 'obito' then 'obito' when p_receita_dados is not null then 'receita' when p_consulta is not null then 'retificacao' else 'atendimento' end;
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
  if v_tipo = 'receita' and public.pet_em_obito(p_receita_pet) then
    raise exception 'Animal com óbito registrado: não é possível criar novos registros para ele';
  end if;
  if v_tipo = 'obito' and (p_pet_alvo is null or p_dados is null or not exists (select 1 from public.pets where id = p_pet_alvo)) then
    raise exception 'Animal não encontrado';
  end if;
  if v_tipo = 'obito' and public.pet_em_obito(p_pet_alvo) then
    raise exception 'Este animal já tem óbito registrado';
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

  insert into public.liberacoes_atendimento (aluno_id, supervisor_id, medico_id, participantes, tipo, consulta_alvo, receita_pet_id, receita_dados, pet_alvo, dados_pedido)
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
    case when v_tipo = 'receita' then p_receita_dados end,
    case when v_tipo = 'obito' then p_pet_alvo end,
    case when v_tipo = 'obito' then p_dados end
  )
  returning id into v_liberacao;

  return v_liberacao;
end;
$$;

drop function if exists public.solicitar_liberacao(uuid, uuid[], integer, integer, jsonb);
create or replace function public.solicitar_liberacao(
  p_supervisor uuid, p_participantes uuid[] default '{}', p_consulta integer default null,
  p_receita_pet integer default null, p_receita_dados jsonb default null,
  p_tipo text default null, p_pet_alvo integer default null, p_dados jsonb default null
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_aluno uuid := auth.uid();
  v_medico_id integer;
  v_liberacao uuid;
  v_tipo text := case when p_tipo = 'obito' then 'obito' when p_receita_dados is not null then 'receita' when p_consulta is not null then 'retificacao' else 'atendimento' end;
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
  if v_tipo = 'receita' and public.pet_em_obito(p_receita_pet) then
    raise exception 'Animal com óbito registrado: não é possível criar novos registros para ele';
  end if;
  if v_tipo = 'obito' and (p_pet_alvo is null or p_dados is null or not exists (select 1 from public.pets where id = p_pet_alvo)) then
    raise exception 'Animal não encontrado';
  end if;
  if v_tipo = 'obito' and public.pet_em_obito(p_pet_alvo) then
    raise exception 'Este animal já tem óbito registrado';
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

  insert into public.liberacoes_atendimento (aluno_id, supervisor_id, medico_id, participantes, status, metodo, tipo, consulta_alvo, receita_pet_id, receita_dados, pet_alvo, dados_pedido)
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
    case when v_tipo = 'receita' then p_receita_dados end,
    case when v_tipo = 'obito' then p_pet_alvo end,
    case when v_tipo = 'obito' then p_dados end
  )
  returning id into v_liberacao;

  return v_liberacao;
end;
$$;

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
  elsif v_liberacao.tipo = 'obito' then
    perform public.registrar_obito_da_liberacao(p_liberacao);
  end if;
end;
$$;

drop function if exists public.pedidos_liberacao_pendentes();
create or replace function public.pedidos_liberacao_pendentes()
returns table (id uuid, aluno_nome text, aluno_matricula text, participantes text[], criada_em timestamptz, tipo text, consulta_alvo integer, paciente text, receita_dados jsonb, dados_pedido jsonb)
language sql stable security definer set search_path = public as $$
  select l.id, a.name, a.matricula,
    coalesce((select array_agg(p.name order by p.name) from public.profiles p where p.id = any(l.participantes)), '{}'),
    l.criada_em, l.tipo, l.consulta_alvo,
    coalesce(
      (select pt.nome from public.consultas c join public.pets pt on pt.id = c.pet_id where c.id = l.consulta_alvo),
      (select pt.nome from public.pets pt where pt.id = coalesce(l.receita_pet_id, l.pet_alvo))
    ),
    l.receita_dados,
    l.dados_pedido
  from public.liberacoes_atendimento l
  join public.profiles a on a.id = l.aluno_id
  where l.supervisor_id = auth.uid() and l.status = 'pendente'
    and l.criada_em > now() - interval '30 minutes'
    and public.meu_papel_aprovado() = 'veterinarian'
  order by l.criada_em;
$$;

revoke all on function public.registrar_obito(integer, jsonb) from public;
revoke all on function public.registrar_obito_liberado(uuid) from public;
revoke all on function public.retificar_obito(bigint, jsonb, text) from public;
revoke all on function public.liberar_atendimento(uuid, text, uuid[], integer, integer, jsonb, text, integer, jsonb) from public;
revoke all on function public.solicitar_liberacao(uuid, uuid[], integer, integer, jsonb, text, integer, jsonb) from public;
revoke all on function public.pedidos_liberacao_pendentes() from public;
grant execute on function public.pet_em_obito(integer) to authenticated;
grant execute on function public.registrar_obito(integer, jsonb) to authenticated;
grant execute on function public.registrar_obito_liberado(uuid) to authenticated;
grant execute on function public.retificar_obito(bigint, jsonb, text) to authenticated;
grant execute on function public.liberar_atendimento(uuid, text, uuid[], integer, integer, jsonb, text, integer, jsonb) to authenticated;
grant execute on function public.solicitar_liberacao(uuid, uuid[], integer, integer, jsonb, text, integer, jsonb) to authenticated;
grant execute on function public.pedidos_liberacao_pendentes() to authenticated;

notify pgrst, 'reload schema';
