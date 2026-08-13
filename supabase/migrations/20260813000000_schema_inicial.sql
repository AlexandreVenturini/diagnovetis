create table if not exists medicos (
  id integer primary key,
  nome text not null,
  telefone text not null,
  email text not null,
  especialidade text not null,
  crmv text not null
);

create table if not exists enderecos (
  id serial primary key,
  rua text not null,
  numero integer not null,
  bairro text not null,
  cidade text not null,
  uf text not null,
  cep text not null
);

create table if not exists tutores (
  id integer primary key,
  nome text not null,
  telefone text not null,
  email text not null,
  data_cadastro timestamptz not null,
  endereco_id integer references enderecos(id)
);

create table if not exists pets (
  id integer primary key,
  nome text not null,
  especie text not null,
  raca text not null,
  tutor_id integer references tutores(id),
  idade text,
  peso text,
  sexo text,
  historico text
);

create table if not exists alunos (
  id integer primary key,
  nome text not null,
  telefone text not null,
  email text not null,
  matricula text not null,
  periodo integer not null,
  curso text not null,
  medico_orientador_id integer references medicos(id)
);

create table if not exists zoonoses (
  id integer primary key,
  nome text not null,
  agente_etiologico text not null,
  sintomas text not null,
  medidas_preventivas text not null,
  grau_risco text not null
);

create table if not exists medicamentos (
  id integer primary key,
  nome_comercial text not null,
  principio_ativo text not null,
  descricao text,
  concentracao numeric not null,
  unidade_concentracao text not null,
  forma_farmaceutica text not null,
  via_administracao text not null,
  tipo_uso text not null
);

create table if not exists funcionarios (
  id integer primary key,
  data_admissao timestamptz not null,
  medico_id integer references medicos(id)
);

create table if not exists consultas (
  id integer primary key,
  data_consulta timestamptz not null,
  horario text not null,
  diagnostico text,
  observacoes text,
  responsavel_id integer references medicos(id),
  pet_id integer references pets(id),
  diagnostico_zoonose_status text,
  diagnostico_zoonose_observacoes text,
  diagnostico_zoonose_data_confirmacao timestamptz
);

create table if not exists consulta_alunos (
  consulta_id integer references consultas(id),
  aluno_id integer references alunos(id),
  primary key (consulta_id, aluno_id)
);

create table if not exists exames (
  id integer primary key,
  consulta_id integer references consultas(id),
  nome_exame text not null,
  data_exame timestamptz not null,
  resultado text
);

create table if not exists receitas (
  id integer primary key,
  consulta_id integer references consultas(id)
);

create table if not exists medicamentos_receitados (
  id serial primary key,
  receita_id integer references receitas(id),
  medicamento_id integer references medicamentos(id),
  quantidade integer not null,
  dose text not null,
  vezes_ao_dia integer not null,
  duracao_dias integer not null,
  observacao text
);
