import type { DadosAtendimento } from '../features/atendimentos/atendimentoTipos'
import type { Receita } from '../features/receitas/receita'

export type PrescricaoSalva = {
  versao: 1
  emitidaEm: string
  paciente: DadosAtendimento
  receita: Receita
}
