# Receituário: atualização e envio

## O que mudou

- Nova aba **Receituário** no perfil veterinário, com **Histórico** e **Nova receita**.
- O formulário de receita saiu do atendimento. As receitas antigas em `consultas.prescricao` continuam disponíveis.
- Histórico com busca por animal, tutor, veterinário, CRMV e medicamento; filtro por data; detalhes; impressão/PDF e acesso ao prontuário.
- Nova receita: animal cadastrado, tutor automático, identificação, peso atual, veterinário/CRMV, busca de medicamentos, prescrição, orientações, visualização e emissão.
- Cálculo opcional para soluções em mg/mL: peso em kg × dose em mg/kg por administração = mg; mg ÷ concentração em mg/mL = mL. Não sugere medicamentos nem doses clínicas. A dose calculada precisa ser aplicada ao item e revisada pelo profissional.
- Cada emissão salva uma cópia dos dados diretamente no prontuário do animal, sem criar uma consulta fictícia. Receitas emitidas não são editadas.
- Repetir uma tentativa de emissão na mesma tela reutiliza o identificador e recupera a receita já gravada, evitando duplicação após falha de conexão.

## 1. Atualizar o banco antes de publicar a aplicação

No projeto Supabase usado pela aplicação, execute no SQL Editor o conteúdo completo de:

`supabase/migrations/20260915000000_receituario.sql`

O banco também precisa ter recebido a migração anterior `20260914000000_consultas_prescricao.sql`.

A nova tabela é `prescricoes`, com vínculo por ID ao animal e ao veterinário. As políticas permitem leitura autenticada e emissão por usuário autenticado com o perfil `veterinarian`, seguindo o perfil utilizado pela aplicação. O cadastro e a gestão de permissões de usuários existentes não foram alterados.

O envio ao GitHub, por si só, não executa esse SQL. Nenhuma atualização foi aplicada ao banco remoto durante o desenvolvimento.

## 2. Conferir localmente

```powershell
cd C:\Users\Usuario\Desktop\diagnovetis-main
npm test
npm run build
npm run dev
```

Se o comando `npm` apresentar erro sobre `npm-cli.js` neste computador, use `& 'C:\Program Files\nodejs\npm.cmd'` em seu lugar.

Depois da migração, entre com o perfil veterinário e confira: criar uma receita de teste, visualizar, emitir, reabrir pelo histórico, imprimir/salvar PDF e abrir o prontuário. Confira também uma receita antiga e a mensagem ao bloquear novas janelas. A gravação em um Supabase real e a interface em navegador autenticado ainda precisam dessa conferência; os testes de persistência usam simulação do banco.

Os rascunhos ficam na tela atual: sair do módulo ou recarregar a página descarta o que não foi emitido. Se a conexão cair durante a emissão, permaneça na tela e use **Tentar emissão novamente**.

## 3. Enviar ao GitHub

O repositório está na branch `main`, com `origin` apontando para `https://github.com/AlexandreVenturini/diagnovetis.git`.

```powershell
cd C:\Users\Usuario\Desktop\diagnovetis-main
git status
git add src/App.css src/components/layout/MainNavigation.tsx src/features/consultations src/features/records/RecordsModule.tsx src/features/veterinarian/VeterinarianDashboard.tsx src/features/prescriptions src/services/PrescriptionService.ts src/tests/PrescriptionService.test.ts src/tests/doseCalculation.test.ts supabase/migrations/20260915000000_receituario.sql RECEITUARIO-GITHUB.md
git commit -m "Cria aba de receituario com historico e emissao integrada ao prontuario"
git push origin main
```

Se o Git informar que existem alterações remotas, integre-as antes de tentar novamente. Não use envio forçado.

## Validação de desenvolvimento

- 298 testes passaram.
- Compilação de produção passou, com aviso de tamanho do pacote JavaScript acima de 500 kB.
- A checagem de estilo dos arquivos novos passou. A checagem geral tem falhas preexistentes em outros arquivos, incluindo hooks, prontuários e configuração de testes; elas podem bloquear o workflow de CI atual.
- Nenhum commit ou envio ao GitHub foi feito automaticamente.
