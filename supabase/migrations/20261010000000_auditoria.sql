create table if not exists public.auditoria (
  id bigint generated always as identity primary key,
  tabela text not null,
  registro_id text not null,
  acao text not null check (acao in ('criou', 'alterou', 'apagou')),
  usuario_id uuid,
  usuario_nome text not null,
  feito_em timestamptz not null default now(),
  alteracoes jsonb not null
);

create index if not exists auditoria_registro_idx on public.auditoria (tabela, registro_id, feito_em);
create index if not exists auditoria_usuario_idx on public.auditoria (usuario_id, feito_em);

alter table public.auditoria enable row level security;
revoke all on public.auditoria from anon, authenticated;

create or replace function public.registrar_auditoria()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_antes jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  v_depois jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  v_linha jsonb := coalesce(v_depois, v_antes);
  v_usuario uuid := auth.uid();
  v_registro text;
  v_alteracoes jsonb;
begin
  if tg_nargs = 0 then
    v_registro := v_linha->>'id';
  else
    select string_agg(v_linha->>chave, ':' order by posicao) into v_registro
      from unnest(tg_argv) with ordinality as c(chave, posicao);
  end if;

  if tg_op = 'UPDATE' then
    select jsonb_object_agg(d.key, jsonb_build_object('antes', v_antes->d.key, 'depois', d.value))
      into v_alteracoes
      from jsonb_each(v_depois) d
      where d.key <> 'atualizado_em' and d.value is distinct from v_antes->d.key;
    if v_alteracoes is null then
      return null;
    end if;
  else
    v_alteracoes := v_linha;
  end if;

  insert into public.auditoria (tabela, registro_id, acao, usuario_id, usuario_nome, alteracoes)
  values (
    tg_table_name,
    coalesce(v_registro, ''),
    case tg_op when 'INSERT' then 'criou' when 'UPDATE' then 'alterou' else 'apagou' end,
    v_usuario,
    coalesce(
      (select name from public.profiles where id = v_usuario),
      case when v_usuario is null then 'sistema' else 'usuário removido' end
    ),
    v_alteracoes
  );
  return null;
end;
$$;

create or replace function public.bloquear_alteracao_auditoria()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'A auditoria não pode ser alterada nem apagada';
end;
$$;

create or replace trigger auditoria_imutavel before update or delete on public.auditoria
  for each row execute function public.bloquear_alteracao_auditoria();
create or replace trigger auditoria_sem_truncate before truncate on public.auditoria
  for each statement execute function public.bloquear_alteracao_auditoria();

create or replace trigger agendamentos_auditoria after insert or update or delete on public.agendamentos
  for each row execute function public.registrar_auditoria();
create or replace trigger consultas_auditoria after insert or update or delete on public.consultas
  for each row execute function public.registrar_auditoria();
create or replace trigger consulta_participantes_auditoria after insert or update or delete on public.consulta_participantes
  for each row execute function public.registrar_auditoria('consulta_id', 'profile_id');
create or replace trigger enderecos_auditoria after insert or update or delete on public.enderecos
  for each row execute function public.registrar_auditoria();
create or replace trigger exames_auditoria after insert or update or delete on public.exames
  for each row execute function public.registrar_auditoria();
create or replace trigger liberacoes_atendimento_auditoria after insert or update or delete on public.liberacoes_atendimento
  for each row execute function public.registrar_auditoria();
create or replace trigger medicamentos_auditoria after insert or update or delete on public.medicamentos
  for each row execute function public.registrar_auditoria();
create or replace trigger medicos_auditoria after insert or update or delete on public.medicos
  for each row execute function public.registrar_auditoria();
create or replace trigger obitos_auditoria after insert or update or delete on public.obitos
  for each row execute function public.registrar_auditoria();
create or replace trigger pets_auditoria after insert or update or delete on public.pets
  for each row execute function public.registrar_auditoria();
create or replace trigger prescricoes_auditoria after insert or update or delete on public.prescricoes
  for each row execute function public.registrar_auditoria();
create or replace trigger profiles_auditoria after insert or update or delete on public.profiles
  for each row execute function public.registrar_auditoria();
create or replace trigger tutores_auditoria after insert or update or delete on public.tutores
  for each row execute function public.registrar_auditoria();
create or replace trigger zoonoses_auditoria after insert or update or delete on public.zoonoses
  for each row execute function public.registrar_auditoria();

revoke execute on function public.registrar_auditoria() from anon, authenticated, public;
revoke execute on function public.bloquear_alteracao_auditoria() from anon, authenticated, public;
