-- Receitas independentes de consultas, vinculadas diretamente ao prontuário do animal.
create table public.prescricoes (
  id uuid primary key,
  pet_id integer not null references public.pets(id),
  veterinario_id integer not null references public.medicos(id),
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users(id),
  constraint snapshot_version check (snapshot->>'version' = '1')
);
create index prescricoes_pet_id_idx on public.prescricoes(pet_id);
alter table public.prescricoes enable row level security;
create policy prescricoes_read on public.prescricoes for select to authenticated using (true);
create policy prescricoes_insert on public.prescricoes for insert to authenticated
  with check (created_by = auth.uid() and auth.jwt()->'user_metadata'->>'role' = 'veterinarian');
grant select, insert on public.prescricoes to authenticated;
notify pgrst, 'reload schema';
