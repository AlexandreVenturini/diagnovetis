import type { PrescricaoSalva } from '../../models/Prescricao'

export type TipoLiberacao = 'atendimento' | 'retificacao' | 'receita' | 'obito'
export type LiberacaoStatus = 'pendente' | 'aberta' | 'recusada' | 'finalizada' | 'cancelada'

export type OpcaoVeterinario = { idPerfil: string; medicoId: number; nome: string; crmv: string; email: string }
export type OpcaoEstudante = { idPerfil: string; nome: string; matricula: string }
export type Liberacao = { id: string; supervisor: OpcaoVeterinario; participantes: OpcaoEstudante[] }

export type ObitoDados = {
  data_hora: string
  circunstancias: string
  causa_provavel: string
  houve_reanimacao: boolean
  eutanasia: boolean
  medico_responsavel_id: number
  comunicado_responsavel: boolean
  comunicacao_detalhes: string
  necropsia: boolean
  destino_corpo: string
  consulta_id?: number | null
}

export type ReceitaParaAprovar = { petId: number; dados: PrescricaoSalva }
export type ObitoParaAprovar = { petId: number; dados: ObitoDados }
export type AlvoLiberacao = { consultaId?: number; receita?: ReceitaParaAprovar; obito?: ObitoParaAprovar }

export type PedidoLiberacao = {
  id: string
  alunoNome: string
  alunoMatricula: string
  participantes: string[]
  criadaEm: string
  tipo: TipoLiberacao
  consultaAlvo: number | null
  paciente: string
  receita: PrescricaoSalva | null
  obito: ObitoDados | null
}

export type SituacaoLiberacao = {
  status: LiberacaoStatus
  motivoRecusa: string
  prescricaoId: string | null
  obitoId: number | null
}
