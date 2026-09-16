import { useRef, useState } from 'react'
import { Exame, EXAME_STATUS_LABEL } from '../../models/Exame'
import { ExameService } from '../../services/ExameService'
import { ExamFields } from '../consultations/ExamFields'
import { examToDraft, type ExamDraft } from '../consultations/examTypes'
import type { ClinicalRecord } from './recordTypes'

const service = new ExameService()
const formatDate = (date: Date | null) => date ? date.toLocaleDateString('pt-BR') : 'Não informada'
export function RecordExams({ records, onSaved }: { records: ClinicalRecord[]; onSaved: (exam: Exame) => void }) {
  const [editing, setEditing] = useState<{ exam: Exame; draft: ExamDraft } | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const lock = useRef(false)
  async function save() {
    if (!editing || lock.current) return
    lock.current = true; setSaving(true); setMessage('')
    try { const result = await service.atualizarResultado(editing.exam, editing.draft); onSaved(result); setEditing(null); setMessage('Exame atualizado. Os demais dados da consulta foram preservados.') }
    catch (error) { setMessage((error as Error).message) }
    finally { lock.current = false; setSaving(false) }
  }
  const groups = records.filter(record => record.complementaryExams?.length)
  return <div className="record-exams">
    {!groups.length && <p>Nenhum exame complementar vinculado a este prontuário.</p>}
    {groups.map(record => <section key={record.id}><h4>Consulta nº {record.id} · {new Date(`${record.date}T12:00:00`).toLocaleDateString('pt-BR')}</h4>{record.complementaryExams!.map(exam => <article className="record-exam" key={exam.id}>
      <header><strong>{exam.nomeExame}</strong><span className={`exam-status exam-status-${exam.status}`}>{EXAME_STATUS_LABEL[exam.status]}</span></header>
      <dl><div><dt>Categoria</dt><dd>{exam.categoria === 'imagem' ? 'Imagem' : exam.categoria === 'laboratorial' ? 'Laboratorial' : 'Outro'}</dd></div><div><dt>Solicitação</dt><dd>{formatDate(exam.dataSolicitacao)}</dd></div><div><dt>Realização</dt><dd>{formatDate(exam.dataRealizacao)}</dd></div></dl>
      <p><b>Resultado:</b> {exam.resultado || (exam.status === 'cancelado' ? 'Exame cancelado' : 'Aguardando resultado')}</p><p><b>Interpretação clínica:</b> {exam.interpretacao || 'Não informada'}</p>
      {editing?.exam.id === exam.id ? <fieldset className="exam-result-editor exam-no-print" disabled={saving}><legend>Atualizar acompanhamento / resultado</legend><ExamFields resultOnly value={editing.draft} onChange={draft => setEditing({ ...editing, draft })} /><div className="form-actions"><button type="button" className="primary-button" onClick={() => void save()}>{saving ? 'Salvando…' : 'Salvar exame'}</button><button type="button" className="secondary-button" onClick={() => { setEditing(null); setMessage('') }}>Cancelar edição</button></div></fieldset> : <button type="button" className="secondary-button exam-no-print" disabled={saving} onClick={() => { setEditing({ exam, draft: examToDraft(exam) }); setMessage('') }}>Atualizar status / resultado</button>}
    </article>)}</section>)}
    {message && <p role="status" className="consultation-message exam-no-print">{message}</p>}
  </div>
}
