import { validateReportAttachment } from './examReportFile'
import { Exame, EXAME_STATUS, type ExameCategoria, type ExameStatus, type LaudoAnexo } from '../../models/Exame'

export type ExamDraft = {
  laudoCarregando?: boolean; laudo?: string; laudoAnexo?: LaudoAnexo | null;
  key: string; nome: string; categoria: ExameCategoria; dataSolicitacao: string;
  dataRealizacao: string; status: ExameStatus; resultado: string; interpretacao: string;
}
export const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
export const newExam = (nome: string, categoria: ExameCategoria): ExamDraft => ({
  key: crypto.randomUUID(), nome, categoria, dataSolicitacao: localDate(), dataRealizacao: '',
  laudo: '', laudoAnexo: null, status: 'solicitado', resultado: '', interpretacao: '',
})
export function validateExam(draft: ExamDraft): string {
  if (draft.laudoCarregando) return 'Aguarde o carregamento do anexo do laudo.'
  if (draft.laudoAnexo) { const error = validateReportAttachment(draft.laudoAnexo); if (error) return error }
  if (!draft.nome.trim()) return 'Informe o nome de cada exame.'
  if (!['laboratorial', 'imagem', 'outro'].includes(draft.categoria) || !EXAME_STATUS.includes(draft.status)) return 'Categoria ou status de exame inválido.'
  const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
  if (!validDate(draft.dataSolicitacao) || draft.dataSolicitacao > localDate()) return 'Informe uma data de solicitação válida, até hoje.'
  if (draft.dataRealizacao && (!validDate(draft.dataRealizacao) || draft.dataRealizacao < draft.dataSolicitacao || draft.dataRealizacao > localDate())) return 'A realização deve ocorrer entre a solicitação e hoje.'
  if (draft.status === 'concluido' && (!draft.resultado.trim() || !draft.dataRealizacao)) return 'Para concluir o exame, informe a data de realização e o resultado.'
  return ''
}
export function draftToExam(draft: ExamDraft): Exame {
  const error = validateExam(draft)
  if (error) throw new Error(error)
  const exam = new Exame(0, draft.nome.trim(), new Date(`${draft.dataSolicitacao}T12:00:00`), draft.resultado.trim())
  exam.categoria = draft.categoria; exam.dataSolicitacao = new Date(`${draft.dataSolicitacao}T12:00:00`)
  exam.dataRealizacao = draft.dataRealizacao ? new Date(`${draft.dataRealizacao}T12:00:00`) : null
  exam.status = draft.status; exam.interpretacao = draft.interpretacao.trim()
  exam.laudo = draft.laudo?.trim() ?? ''; exam.laudoAnexo = draft.laudoAnexo ?? null
  return exam
}
export function examToDraft(exam: Exame): ExamDraft {
  return { laudo: exam.laudo, laudoAnexo: exam.laudoAnexo, key: String(exam.id), nome: exam.nomeExame, categoria: exam.categoria,
    dataSolicitacao: localDate(exam.dataSolicitacao), dataRealizacao: exam.dataRealizacao ? localDate(exam.dataRealizacao) : '',
    status: exam.status, resultado: exam.resultado, interpretacao: exam.interpretacao }
}
