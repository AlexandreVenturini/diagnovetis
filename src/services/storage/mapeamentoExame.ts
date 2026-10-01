import { Exame, type ExameCategoria, type ExameStatus, type LaudoAnexo } from '../../models/Exame'

export interface ExameRow {
  laudo?: string
  laudo_anexo?: LaudoAnexo | null
  id: number
  consulta_id?: number
  nome_exame: string
  data_exame: string
  resultado: string | null
  categoria?: ExameCategoria
  data_solicitacao?: string
  data_realizacao?: string | null
  status?: ExameStatus
  interpretacao_clinica?: string
}
const data = (valor: string) => new Date(valor.length === 10 ? `${valor}T12:00:00` : valor)
const apenasData = (valor: Date) =>
  `${valor.getFullYear()}-${String(valor.getMonth() + 1).padStart(2, '0')}-${String(valor.getDate()).padStart(2, '0')}`
export function linhaParaExame(linha: ExameRow): Exame {
  const exame = new Exame(linha.id, linha.nome_exame, data(linha.data_exame), linha.resultado ?? '')
  exame.consultaId = linha.consulta_id
  exame.categoria = linha.categoria ?? 'outro'
  exame.dataSolicitacao = data(linha.data_solicitacao ?? linha.data_exame)
  exame.dataRealizacao =
    linha.data_realizacao === undefined
      ? exame.dataRealizacao
      : linha.data_realizacao
        ? data(linha.data_realizacao)
        : null
  exame.status = linha.status ?? exame.status
  exame.interpretacao = linha.interpretacao_clinica ?? ''
  exame.laudo = linha.laudo ?? ''
  exame.laudoAnexo = linha.laudo_anexo ?? null
  return exame
}
export function exameParaLinha(exame: Exame) {
  return {
    ...(exame.id > 0 ? { id: exame.id } : {}),
    nome_exame: exame.nomeExame,
    categoria: exame.categoria,
    data_exame: (exame.dataRealizacao ?? exame.dataSolicitacao).toISOString(),
    data_solicitacao: apenasData(exame.dataSolicitacao),
    data_realizacao: exame.dataRealizacao ? apenasData(exame.dataRealizacao) : null,
    laudo: exame.laudo,
    laudo_anexo: exame.laudoAnexo,
    status: exame.status,
    resultado: exame.resultado,
    interpretacao_clinica: exame.interpretacao,
  }
}
