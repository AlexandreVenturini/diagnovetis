drop table if exists public.consulta_alunos;
drop table if exists public.medicamentos_receitados;
drop table if exists public.receitas;
drop table if exists public.alunos;
drop table if exists public.funcionarios;

alter table public.consultas drop column if exists prescricao;

notify pgrst, 'reload schema';
