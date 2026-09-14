-- Salva a receita e o atendimento na mesma operação, sem alterar registros antigos.
alter table public.consultas
  add column if not exists prescricao jsonb;

comment on column public.consultas.prescricao is
  'Receita finalizada: versão, data de emissão, identificação do paciente e prescrição para reimpressão.';

notify pgrst, 'reload schema';
