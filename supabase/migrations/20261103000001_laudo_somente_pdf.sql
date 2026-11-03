alter table public.exames drop constraint if exists exames_laudo_somente_pdf;
alter table public.exames add constraint exames_laudo_somente_pdf check (
  laudo_anexo is null
  or (
    laudo_anexo->>'tipo' = 'application/pdf'
    and left(laudo_anexo->>'dados', 28) = 'data:application/pdf;base64,'
    and length(laudo_anexo->>'dados') <= 2796260
  )
);
