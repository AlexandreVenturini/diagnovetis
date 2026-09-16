import { EXAME_STATUS, EXAME_STATUS_LABEL } from '../../models/Exame'
import { localDate, type ExamDraft } from './examTypes'

export function ExamFields({ value, onChange, resultOnly = false }: { value: ExamDraft; onChange: (value: ExamDraft) => void; resultOnly?: boolean }) {
  return <div className="consultation-form-grid exam-fields">
    {!resultOnly && <><label>Nome do exame<input value={value.nome} onChange={e => onChange({ ...value, nome: e.target.value })} required /></label><label>Categoria<select value={value.categoria} onChange={e => onChange({ ...value, categoria: e.target.value as ExamDraft['categoria'] })}><option value="laboratorial">Laboratorial</option><option value="imagem">Imagem</option><option value="outro">Outro</option></select></label><label>Data da solicitação<input type="date" max={localDate()} value={value.dataSolicitacao} onChange={e => onChange({ ...value, dataSolicitacao: e.target.value })} required /></label></>}
    <label>Status<select value={value.status} onChange={e => onChange({ ...value, status: e.target.value as ExamDraft['status'] })}>{EXAME_STATUS.map(status => <option key={status} value={status}>{EXAME_STATUS_LABEL[status]}</option>)}</select></label>
    <label>Data de realização<input type="date" min={value.dataSolicitacao} max={localDate()} value={value.dataRealizacao} onChange={e => onChange({ ...value, dataRealizacao: e.target.value })} required={value.status === 'concluido'} /></label>
    <label className="full-field">Resultado<textarea value={value.resultado} onChange={e => onChange({ ...value, resultado: e.target.value })} placeholder="Aguardando resultado" required={value.status === 'concluido'} /></label>
    <label className="full-field">Interpretação clínica<textarea value={value.interpretacao} onChange={e => onChange({ ...value, interpretacao: e.target.value })} placeholder="Registre a interpretação do profissional responsável" /></label>
  </div>
}
