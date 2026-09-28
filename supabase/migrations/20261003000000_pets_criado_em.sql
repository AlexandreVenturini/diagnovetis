alter table public.pets add column if not exists criado_em timestamptz not null default now();

create index if not exists pets_criado_em_idx on public.pets (criado_em);
create index if not exists consultas_data_consulta_idx on public.consultas (data_consulta);
create index if not exists agendamentos_date_idx on public.agendamentos (date);
create index if not exists prescricoes_created_at_idx on public.prescricoes (created_at);

notify pgrst, 'reload schema';
