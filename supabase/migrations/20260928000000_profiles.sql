create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null default '',
  role text check (role in ('veterinarian', 'attendant')),
  crmv text,
  is_admin boolean not null default false,
  status text not null default 'pendente' check (status in ('pendente', 'aprovado', 'suspenso')),
  email_confirmado boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid() and p.status = 'aprovado'), false);
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role text := new.raw_user_meta_data->>'role';
begin
  insert into public.profiles (id, name, email, role, crmv, email_confirmado)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.email, ''),
    case when v_role in ('veterinarian', 'attendant') then v_role end,
    nullif(new.raw_user_meta_data->>'crmv', ''),
    new.email_confirmed_at is not null
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_user_email_confirmed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles
    set email_confirmado = new.email_confirmed_at is not null, email = coalesce(new.email, email)
    where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of email_confirmed_at, email on auth.users
  for each row execute function public.handle_user_email_confirmed();

insert into public.profiles (id, name, email, role, crmv, is_admin, status, email_confirmado, created_at)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'name', ''),
  coalesce(u.email, ''),
  case when u.raw_user_meta_data->>'role' in ('veterinarian', 'attendant') then u.raw_user_meta_data->>'role' end,
  nullif(u.raw_user_meta_data->>'crmv', ''),
  coalesce((u.raw_user_meta_data->>'is_admin')::boolean, false),
  case
    when u.banned_until is not null and u.banned_until > now() then 'suspenso'
    when u.email_confirmed_at is not null then 'aprovado'
    else 'pendente'
  end,
  u.email_confirmed_at is not null,
  u.created_at
from auth.users u
on conflict (id) do nothing;

alter table public.profiles enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create or replace function public.admin_remover_usuario(p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores podem remover usuários';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'Você não pode remover a própria conta';
  end if;
  delete from auth.users where id = p_user_id;
end;
$$;

revoke all on function public.admin_remover_usuario(uuid) from public;
grant execute on function public.admin_remover_usuario(uuid) to authenticated;

notify pgrst, 'reload schema';
