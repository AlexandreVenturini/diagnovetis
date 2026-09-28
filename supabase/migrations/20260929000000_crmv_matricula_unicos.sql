alter table public.profiles add column if not exists matricula text;

create unique index if not exists profiles_crmv_unico on public.profiles (upper(crmv)) where crmv is not null;
create unique index if not exists profiles_matricula_unica on public.profiles (upper(matricula)) where matricula is not null;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role text := new.raw_user_meta_data->>'role';
  v_crmv text := upper(nullif(btrim(new.raw_user_meta_data->>'crmv'), ''));
  v_matricula text := upper(nullif(btrim(new.raw_user_meta_data->>'matricula'), ''));
begin
  if v_role = 'veterinarian' and v_crmv is null then
    raise exception 'CRMV obrigatório para veterinários';
  end if;
  if v_role = 'attendant' and v_matricula is null then
    raise exception 'Matrícula obrigatória para estudantes';
  end if;

  insert into public.profiles (id, name, email, role, crmv, matricula, email_confirmado)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.email, ''),
    case when v_role in ('veterinarian', 'attendant') then v_role end,
    case when v_role = 'veterinarian' then v_crmv end,
    case when v_role = 'attendant' then v_matricula end,
    new.email_confirmed_at is not null
  );
  return new;
end;
$$;

create or replace function public.cadastro_disponivel(p_crmv text default null, p_matricula text default null)
returns text language sql stable security definer set search_path = public as $$
  select case
    when nullif(btrim(p_crmv), '') is not null
      and exists (select 1 from public.profiles where upper(crmv) = upper(btrim(p_crmv)))
      then 'crmv'
    when nullif(btrim(p_matricula), '') is not null
      and exists (select 1 from public.profiles where upper(matricula) = upper(btrim(p_matricula)))
      then 'matricula'
  end;
$$;

revoke all on function public.cadastro_disponivel(text, text) from public;
grant execute on function public.cadastro_disponivel(text, text) to anon, authenticated;

create or replace function public.criar_medico_aprovado()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'aprovado' and new.role = 'veterinarian' and new.crmv is not null
    and not exists (select 1 from public.medicos where lower(email) = lower(new.email)) then
    lock table public.medicos in share row exclusive mode;
    insert into public.medicos (id, nome, telefone, email, especialidade, crmv)
    values ((select coalesce(max(id), 0) + 1 from public.medicos), new.name, '', new.email, '', new.crmv);
  end if;
  return new;
end;
$$;

drop trigger if exists on_profile_aprovado on public.profiles;
create trigger on_profile_aprovado
  after insert or update of status on public.profiles
  for each row execute function public.criar_medico_aprovado();

update public.profiles set status = status
  where status = 'aprovado' and role = 'veterinarian' and crmv is not null;

notify pgrst, 'reload schema';
