create or replace function public.usuario_aprovado()
returns boolean
language sql
stable
set search_path = public
as $$
  select public.meu_papel_aprovado() is not null;
$$;

create or replace function public.veterinario_aprovado()
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(public.meu_papel_aprovado() = 'veterinarian', false);
$$;

create or replace function public.pet_tem_historico(p_pet integer)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.consultas where pet_id = p_pet)
    or exists (select 1 from public.agendamentos where dog_id = p_pet)
    or exists (select 1 from public.prescricoes where pet_id = p_pet)
    or exists (select 1 from public.obitos where pet_id = p_pet)
    or exists (select 1 from public.liberacoes_atendimento where pet_alvo = p_pet or receita_pet_id = p_pet);
$$;

alter table public.pets enable row level security;
alter table public.tutores enable row level security;
alter table public.enderecos enable row level security;
alter table public.agendamentos enable row level security;
alter table public.consultas enable row level security;
alter table public.exames enable row level security;
alter table public.medicamentos enable row level security;
alter table public.zoonoses enable row level security;
alter table public.medicos enable row level security;

drop policy if exists pets_select on public.pets;
drop policy if exists pets_insert on public.pets;
drop policy if exists pets_update on public.pets;
drop policy if exists pets_delete on public.pets;
create policy pets_select on public.pets for select to authenticated using ((select public.usuario_aprovado()));
create policy pets_insert on public.pets for insert to authenticated with check ((select public.usuario_aprovado()));
create policy pets_update on public.pets for update to authenticated
  using ((select public.usuario_aprovado())) with check ((select public.usuario_aprovado()));
create policy pets_delete on public.pets for delete to authenticated
  using ((select public.veterinario_aprovado()) and not public.pet_tem_historico(id));

drop policy if exists tutores_select on public.tutores;
drop policy if exists tutores_insert on public.tutores;
drop policy if exists tutores_update on public.tutores;
create policy tutores_select on public.tutores for select to authenticated using ((select public.usuario_aprovado()));
create policy tutores_insert on public.tutores for insert to authenticated with check ((select public.usuario_aprovado()));
create policy tutores_update on public.tutores for update to authenticated
  using ((select public.usuario_aprovado())) with check ((select public.usuario_aprovado()));

drop policy if exists enderecos_select on public.enderecos;
drop policy if exists enderecos_insert on public.enderecos;
drop policy if exists enderecos_update on public.enderecos;
create policy enderecos_select on public.enderecos for select to authenticated using ((select public.usuario_aprovado()));
create policy enderecos_insert on public.enderecos for insert to authenticated with check ((select public.usuario_aprovado()));
create policy enderecos_update on public.enderecos for update to authenticated
  using ((select public.usuario_aprovado())) with check ((select public.usuario_aprovado()));

drop policy if exists agendamentos_select on public.agendamentos;
drop policy if exists agendamentos_insert on public.agendamentos;
drop policy if exists agendamentos_update on public.agendamentos;
create policy agendamentos_select on public.agendamentos for select to authenticated
  using ((select public.usuario_aprovado()));
create policy agendamentos_insert on public.agendamentos for insert to authenticated
  with check ((select public.usuario_aprovado()));
create policy agendamentos_update on public.agendamentos for update to authenticated
  using ((select public.usuario_aprovado())) with check ((select public.usuario_aprovado()));

drop policy if exists medicamentos_select on public.medicamentos;
drop policy if exists medicamentos_insert on public.medicamentos;
create policy medicamentos_select on public.medicamentos for select to authenticated
  using ((select public.usuario_aprovado()));
create policy medicamentos_insert on public.medicamentos for insert to authenticated
  with check ((select public.veterinario_aprovado()));

drop policy if exists zoonoses_select on public.zoonoses;
drop policy if exists zoonoses_insert on public.zoonoses;
create policy zoonoses_select on public.zoonoses for select to authenticated using ((select public.usuario_aprovado()));
create policy zoonoses_insert on public.zoonoses for insert to authenticated
  with check ((select public.veterinario_aprovado()));

drop policy if exists medicos_select on public.medicos;
create policy medicos_select on public.medicos for select to authenticated using ((select public.usuario_aprovado()));

drop policy if exists consultas_select on public.consultas;
create policy consultas_select on public.consultas for select to authenticated
  using ((select public.usuario_aprovado()) and (situacao = 'finalizado' or public.envolvido_no_atendimento(id)));

drop policy if exists exames_select on public.exames;
drop policy if exists exames_update on public.exames;
create policy exames_select on public.exames for select to authenticated
  using (exists (select 1 from public.consultas c where c.id = consulta_id));
create policy exames_update on public.exames for update to authenticated
  using ((select public.veterinario_aprovado()) and exists (select 1 from public.consultas c where c.id = consulta_id))
  with check ((select public.veterinario_aprovado()));

drop policy if exists consulta_participantes_select on public.consulta_participantes;
create policy consulta_participantes_select on public.consulta_participantes for select to authenticated
  using (exists (select 1 from public.consultas c where c.id = consulta_id));

drop policy if exists consulta_versoes_select on public.consulta_versoes;
create policy consulta_versoes_select on public.consulta_versoes for select to authenticated
  using (exists (select 1 from public.consultas c where c.id = consulta_id));

drop policy if exists obitos_select on public.obitos;
create policy obitos_select on public.obitos for select to authenticated using ((select public.usuario_aprovado()));

drop policy if exists obito_versoes_select on public.obito_versoes;
create policy obito_versoes_select on public.obito_versoes for select to authenticated
  using ((select public.usuario_aprovado()));

drop policy if exists prescricoes_read on public.prescricoes;
create policy prescricoes_read on public.prescricoes for select to authenticated using ((select public.usuario_aprovado()));

revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke truncate, references, trigger on all tables in schema public from authenticated;

revoke execute on all functions in schema public from anon, public;
grant execute on function public.cadastro_disponivel(text, text) to anon;
revoke execute on function public.emitir_receita_interna(uuid) from authenticated;
revoke execute on function public.registrar_obito_da_liberacao(uuid) from authenticated;
revoke execute on function public.registrar_obito_interno(integer, jsonb, uuid, uuid) from authenticated;
grant execute on function public.usuario_aprovado() to authenticated;
grant execute on function public.veterinario_aprovado() to authenticated;
grant execute on function public.pet_tem_historico(integer) to authenticated;

alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke execute on functions from anon;
alter default privileges revoke execute on functions from public;
