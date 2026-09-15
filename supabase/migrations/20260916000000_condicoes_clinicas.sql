-- Mantém o catálogo existente e adiciona informações da ficha clínica canina.
alter table public.zoonoses add column if not exists clinical_data jsonb;
comment on column public.zoonoses.clinical_data is
  'Classificação, sistemas, etiologia, idades, transmissão, exames, diferenciais, protocolos e alertas cadastrados pelo profissional.';
notify pgrst, 'reload schema';
