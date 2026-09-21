import { Exame, type ExameCategoria, type ExameStatus, type LaudoAnexo } from '../../models/Exame'

export interface ExameRow {
  laudo?: string; laudo_anexo?: LaudoAnexo | null;
  id: number; consulta_id?: number; nome_exame: string; data_exame: string; resultado: string | null;
  categoria?: ExameCategoria; data_solicitacao?: string; data_realizacao?: string | null;
  status?: ExameStatus; interpretacao_clinica?: string;
}
const date = (value: string) => new Date(value.length === 10 ? `${value}T12:00:00` : value)
const dateOnly = (value: Date) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
export function exameFromRow(row: ExameRow): Exame {
  const exam = new Exame(row.id, row.nome_exame, date(row.data_exame), row.resultado ?? '')
  exam.consultaId = row.consulta_id; exam.categoria = row.categoria ?? 'outro'
  exam.dataSolicitacao = date(row.data_solicitacao ?? row.data_exame)
  exam.dataRealizacao = row.data_realizacao === undefined ? exam.dataRealizacao : row.data_realizacao ? date(row.data_realizacao) : null
  exam.status = row.status ?? exam.status; exam.interpretacao = row.interpretacao_clinica ?? ''
  exam.laudo = row.laudo ?? ''; exam.laudoAnexo = row.laudo_anexo ?? null
  return exam
}
export function exameToRow(exam: Exame) {
  return {
    ...(exam.id > 0 ? { id: exam.id } : {}), nome_exame: exam.nomeExame, categoria: exam.categoria,
    data_exame: (exam.dataRealizacao ?? exam.dataSolicitacao).toISOString(),
    data_solicitacao: dateOnly(exam.dataSolicitacao), data_realizacao: exam.dataRealizacao ? dateOnly(exam.dataRealizacao) : null,
    laudo: exam.laudo, laudo_anexo: exam.laudoAnexo, status: exam.status, resultado: exam.resultado, interpretacao_clinica: exam.interpretacao,
  }
}
