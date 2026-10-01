alter table public.tutores
  add column if not exists tipo text not null default 'pessoa',
  add column if not exists cnpj text not null default '',
  add column if not exists contato text not null default '',
  add column if not exists setor text not null default '',
  add column if not exists observacoes text not null default '';

do $$
begin
  alter table public.tutores add constraint tutores_tipo_check
    check (tipo in ('pessoa', 'instituicao', 'ifes', 'sem_responsavel'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.tutores add constraint tutores_setor_ifes_check check (tipo <> 'ifes' or btrim(setor) <> '');
exception when duplicate_object then null;
end $$;

create unique index if not exists tutores_ifes_setor_idx on public.tutores (lower(btrim(setor))) where tipo = 'ifes';
