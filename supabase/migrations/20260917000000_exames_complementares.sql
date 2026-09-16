alter table public.consultas add column if not exists conduta text;
-- Preserva a tabela e os exames antigos; separa solicitação de realização/resultado.
alter table public.exames
  add column if not exists categoria text not null default 'outro',
  add column if not exists data_solicitacao date,
  add column if not exists data_realizacao date,
  add column if not exists status text,
  add column if not exists interpretacao_clinica text not null default '';

update public.exames set
  data_solicitacao = coalesce(data_solicitacao, data_exame::date),
  data_realizacao = coalesce(data_realizacao, case when nullif(btrim(resultado), '') is not null then data_exame::date end),
  status = coalesce(status, case when nullif(btrim(resultado), '') is not null then 'concluido' else 'solicitado' end);

alter table public.exames
  alter column data_solicitacao set not null,
  alter column status set default 'solicitado',
  alter column status set not null,
  add constraint exames_categoria_valida check (categoria in ('laboratorial', 'imagem', 'outro')),
  add constraint exames_status_valido check (status in ('solicitado', 'agendado', 'coletado', 'aguardando_resultado', 'concluido', 'cancelado')),
  add constraint exames_datas_validas check (data_realizacao is null or data_realizacao >= data_solicitacao),
  add constraint exames_conclusao_valida check (status <> 'concluido' or (data_realizacao is not null and nullif(btrim(resultado), '') is not null));

create sequence if not exists public.exames_id_seq owned by public.exames.id;
select setval('public.exames_id_seq', greatest(coalesce((select max(id) from public.exames), 0) + 1, 1), false);
alter table public.exames alter column id set default nextval('public.exames_id_seq');
create index if not exists exames_consulta_idx on public.exames(consulta_id);
create index if not exists exames_status_idx on public.exames(status);
grant usage, select on sequence public.exames_id_seq to authenticated;

-- SECURITY INVOKER mantém as permissões e políticas das tabelas.
-- Qualquer erro cancela a operação inteira: consulta e todas as solicitações.
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
    insert into public.exames (id, consulta_id, nome_exame, data_exame, categoria, data_solicitacao, data_realizacao, status, resultado, interpretacao_clinica)
    values (coalesce((exame->>'id')::integer, nextval('public.exames_id_seq')), consulta.id,
      exame->>'nome_exame', (exame->>'data_exame')::timestamptz, exame->>'categoria',
      (exame->>'data_solicitacao')::date, (exame->>'data_realizacao')::date,
      exame->>'status', coalesce(exame->>'resultado', ''), coalesce(exame->>'interpretacao_clinica', ''));
  end loop;
end;
$$;
revoke all on function public.salvar_consulta_com_exames(jsonb, jsonb) from public;
grant execute on function public.salvar_consulta_com_exames(jsonb, jsonb) to authenticated;
notify pgrst, 'reload schema';
