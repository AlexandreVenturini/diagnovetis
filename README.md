# Diagnovetis

Aplicação web para gestão de clínicas veterinárias, desenvolvida como projeto acadêmico com React, TypeScript, Vite e Supabase.

O sistema reúne funcionalidades administrativas e clínicas, permitindo acompanhar usuários, animais, consultas, atendimentos, prontuários, medicamentos e informações relacionadas a zoonoses.

## Demonstração

[Conheça a aplicação publicada](https://diagnovetis.vercel.app/)

> A aplicação é um projeto acadêmico e utiliza dados exclusivamente demonstrativos.

## Funcionalidades

- autenticação e criação de contas;
- controle de acesso por perfil;
- cadastro de tutores e animais;
- agenda e gerenciamento de consultas;
- registro de atendimentos clínicos;
- prontuários veterinários;
- registro de exame físico e alta;
- módulo de medicamentos;
- acompanhamento de zoonoses;
- dashboards personalizados;
- geração de relatórios clínicos em PDF;
- persistência de dados e autenticação com Supabase.

## Tecnologias

- React
- TypeScript
- Vite
- Supabase
- HTML e CSS
- ESLint
- Vitest
- Git e GitHub
- Vercel

## Organização do projeto

```text
diagnovetis/
├── public/
├── src/
├── supabase/
├── package.json
├── eslint.config.js
├── tsconfig.json
└── vite.config.ts
```

O código-fonte da interface e das regras da aplicação está organizado em `src`. Os arquivos relacionados à configuração e estrutura do banco estão em `supabase`.

## Executando localmente

### Pré-requisitos

- Node.js instalado;
- npm;
- projeto configurado no Supabase.

### Instalação

Clone o repositório:

```bash
git clone https://github.com/AlexandreVenturini/diagnovetis.git
```

Entre na pasta:

```bash
cd diagnovetis
```

Instale as dependências:

```bash
npm install
```

Inicie o ambiente de desenvolvimento:

```bash
npm run dev
```

O endereço local será informado pelo Vite no terminal.

## Comandos disponíveis

```bash
npm run dev
```

Inicia o ambiente de desenvolvimento.

```bash
npm run build
```

Gera uma versão de produção e verifica o código TypeScript.

```bash
npm run lint
```

Executa a análise estática do código.

```bash
npm run test
```

Executa os testes com Vitest.

```bash
npm run test:coverage
```

Executa os testes e gera o relatório de cobertura.

## Contribuições de Julia de Souza Sacht

Entre as funcionalidades desenvolvidas por [Julia de Souza Sacht](https://github.com/Juliasacht) estão:

- autenticação e criação de contas;
- cadastro de tutores e animais;
- agenda de consultas;
- atendimentos e prontuários clínicos;
- módulos de zoonoses e medicamentos;
- dashboards e áreas de acesso restrito;
- geração de relatórios clínicos em PDF;
- integração de autenticação, prontuários e medicamentos com Supabase;
- organização e manutenção de componentes do front-end.

[Consulte o histórico público das contribuições](https://github.com/AlexandreVenturini/diagnovetis/commits?author=Juliasacht).

## Colaboradores

- [Alexandre Venturini](https://github.com/AlexandreVenturini)
- [Julia de Souza Sacht](https://github.com/Juliasacht)

## Situação do projeto

O projeto continua em evolução, com melhorias na integração com o Supabase, nos fluxos clínicos, na qualidade do código e na cobertura de testes.
