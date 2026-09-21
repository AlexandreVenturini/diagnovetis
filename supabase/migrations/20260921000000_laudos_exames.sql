-- Laudos e anexos seguem as permissões e a transação do exame.
alter table public.exames
  add column if not exists laudo text not null default '',
  add column if not exists laudo_anexo jsonb;

create or replace function public.salvar_consulta_com_exames(p_consulta jsonb, p_exames jsonb)
returns void language plpgsql security invoker set search_path = public as $$
declare
  consulta public.consultas;
  exame jsonb;
begin
  if jsonb_typeof(p_exames) <> 'array' or jsonb_array_length(p_exames) = 0 then
    raise exception 'Informe os exames da consulta';
  end if;
  consulta := jsonb_populate_record(null::public.consultas, p_consulta);
  insert into public.consultas select consulta.*;
  for exame in select value from jsonb_array_elements(p_exames) loop
    if nullif(btrim(exame->>'nome_exame'), '') is null then raise exception 'Nome do exame obrigatório'; end if;
    insert into public.exames (id, consulta_id, nome_exame, data_exame, categoria, data_solicitacao, data_realizacao, status, resultado, interpretacao_clinica, laudo, laudo_anexo)
    values (coalesce((exame->>'id')::integer, nextval('public.exames_id_seq')), consulta.id,
      exame->>'nome_exame', (exame->>'data_exame')::timestamptz, exame->>'categoria',
      (exame->>'data_solicitacao')::date, (exame->>'data_realizacao')::date,
      exame->>'status', coalesce(exame->>'resultado', ''), coalesce(exame->>'interpretacao_clinica', ''), coalesce(exame->>'laudo', ''), nullif(exame->'laudo_anexo', 'null'::jsonb));
  end loop;
end;
$$;
revoke all on function public.salvar_consulta_com_exames(jsonb, jsonb) from public;
grant execute on function public.salvar_consulta_com_exames(jsonb, jsonb) to authenticated;
notify pgrst, 'reload schema';
