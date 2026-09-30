import type { PedidoLiberacao, TipoLiberacao } from './supervisionTypes'

type TextosLiberacao = {
  alvo: string
  alvoRecusa: string
  comParticipantes: boolean
  exigeMotivoRecusa: boolean
  titulo: (consultaId?: number) => string
  explicacao: string
  tituloAguardando: string
  aoAprovar: string
  botaoSenha: string
  textoPedidoRemoto: string
  rotuloPedido: (consultaAlvo: number | null) => string
  mostraPaciente: boolean
  notificacao: (aluno: string, consultaAlvo: number | null) => string
  botaoAprovar: string
}

const TEXTO_PEDIDO_REMOTO_PADRAO =
  'Envia um pedido para a conta do professor. Ele aprova pelo sino no topo da tela, no celular ou computador, sem precisar digitar a senha aqui.'

export const LIBERACAO: Record<TipoLiberacao, TextosLiberacao> = {
  atendimento: {
    alvo: 'o atendimento',
    alvoRecusa: 'o pedido',
    comParticipantes: true,
    exigeMotivoRecusa: false,
    titulo: () => 'Liberação do atendimento',
    explicacao:
      'Antes de começar, escolha o professor responsável pela supervisão e os colegas que vão participar. Depois, o professor libera o atendimento de uma das duas formas abaixo.',
    tituloAguardando: 'Aguardando aprovação',
    aoAprovar: 'abre o atendimento',
    botaoSenha: 'Liberar com senha',
    textoPedidoRemoto: TEXTO_PEDIDO_REMOTO_PADRAO,
    rotuloPedido: () => 'Novo atendimento',
    mostraPaciente: false,
    notificacao: (aluno) => `${aluno} pediu liberação para um atendimento.`,
    botaoAprovar: 'Aprovar',
  },
  retificacao: {
    alvo: 'a retificação',
    alvoRecusa: 'o pedido',
    comParticipantes: false,
    exigeMotivoRecusa: false,
    titulo: (consultaId) => `Liberação da retificação do atendimento nº ${consultaId}`,
    explicacao:
      'Alterações feitas por estudantes em atendimentos finalizados precisam da autorização de um professor. Escolha o professor, que libera a retificação de uma das duas formas abaixo.',
    tituloAguardando: 'Aguardando aprovação da retificação',
    aoAprovar: 'abre a retificação',
    botaoSenha: 'Liberar com senha',
    textoPedidoRemoto: TEXTO_PEDIDO_REMOTO_PADRAO,
    rotuloPedido: (consultaAlvo) => `Retificação do atendimento nº ${consultaAlvo}`,
    mostraPaciente: true,
    notificacao: (aluno, consultaAlvo) => `${aluno} pediu para retificar o atendimento nº ${consultaAlvo}.`,
    botaoAprovar: 'Aprovar',
  },
  receita: {
    alvo: 'a receita',
    alvoRecusa: 'a receita',
    comParticipantes: false,
    exigeMotivoRecusa: true,
    titulo: () => 'Aprovação da receita',
    explicacao:
      'Receitas montadas por estudantes só são emitidas com a aprovação de um médico-veterinário. A receita sai no nome e com o CRMV de quem aprovar.',
    tituloAguardando: 'Aguardando aprovação da receita',
    aoAprovar: 'emite a receita',
    botaoSenha: 'Aprovar com senha',
    textoPedidoRemoto:
      'Envia a receita para a conta do professor. Ele revisa os medicamentos e aprova pelo sino no topo da tela, no celular ou computador.',
    rotuloPedido: () => 'Receita para aprovar',
    mostraPaciente: true,
    notificacao: (aluno) => `${aluno} enviou uma receita para aprovação.`,
    botaoAprovar: 'Aprovar e emitir',
  },
  obito: {
    alvo: 'o registro de óbito',
    alvoRecusa: 'o registro de óbito',
    comParticipantes: false,
    exigeMotivoRecusa: true,
    titulo: () => 'Aprovação do registro de óbito',
    explicacao:
      'O registro de óbito feito por estudantes precisa da aprovação de um médico-veterinário, que confere os dados antes de concluir.',
    tituloAguardando: 'Aguardando aprovação do registro de óbito',
    aoAprovar: 'conclui o registro',
    botaoSenha: 'Aprovar com senha',
    textoPedidoRemoto:
      'Envia o registro para a conta do professor. Ele confere os dados e aprova pelo sino no topo da tela, no celular ou computador.',
    rotuloPedido: () => 'Registro de óbito',
    mostraPaciente: true,
    notificacao: (aluno) => `${aluno} enviou um registro de óbito para aprovação.`,
    botaoAprovar: 'Aprovar e registrar',
  },
}

export function rotuloDoPedido(pedido: PedidoLiberacao): string {
  const textos = LIBERACAO[pedido.tipo]
  const paciente = textos.mostraPaciente && pedido.paciente ? ` · ${pedido.paciente}` : ''
  return `${textos.rotuloPedido(pedido.consultaAlvo)}${paciente}`
}
