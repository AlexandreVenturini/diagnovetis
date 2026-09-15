import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { EMPTY_CLINICAL, type ZoonosisFormData } from './zoonosisTypes'
import { AGES, CATEGORIES, ETIOLOGIES, SYSTEMS } from './clinicalCatalog'

const emptyForm = (): ZoonosisFormData => ({ name: '', agent: '', risk: 'Médio', prevalence: 'Média', hosts: ['Cães'], transmission: '', symptoms: [], diagnostics: [], prevention: [], clinical: structuredClone(EMPTY_CLINICAL) })
const list = (text: string) => text.split('\n').map(value => value.trim()).filter(Boolean)

export function ConditionForm({ onSave, onCancel }: { onSave: (value: ZoonosisFormData) => Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState(emptyForm)
  const [texts, setTexts] = useState({ symptoms: '', diagnostics: '', prevention: '', differentials: '', protocols: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const lock = useRef(false)
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (lock.current) return
    lock.current = true; setSaving(true); setError('')
    try {
      await onSave({ ...form, symptoms: list(texts.symptoms), diagnostics: list(texts.diagnostics), prevention: list(texts.prevention), clinical: { ...form.clinical, differentials: list(texts.differentials), protocols: list(texts.protocols) } })
      onCancel()
    } catch (error) { setError(`${(error as Error).message} Os campos foram mantidos. Confira se a atualização do banco de condições clínicas foi aplicada.`) }
    finally { lock.current = false; setSaving(false) }
  }
  return <form className="zoonosis-form content-card" onSubmit={submit}>
    <div className="zoonosis-form-heading"><h3>Cadastrar condição clínica</h3><p>Base canina · Preencha as informações revisadas pelo profissional responsável.</p></div>
    <fieldset className="condition-form-fields" disabled={saving}><div className="zoonosis-form-grid">
      <label>Nome da condição<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
      <label>Agente etiológico / causa<input required value={form.agent} onChange={e => setForm({ ...form, agent: e.target.value })} placeholder="Informe a causa ou Não definido" /></label>
      <label>Tipo<select value={form.clinical.conditionType} onChange={e => setForm({ ...form, clinical: { ...form.clinical, conditionType: e.target.value } })}>{['Doença', 'Síndrome', 'Condição'].map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Categoria<select required value={form.clinical.category} onChange={e => setForm({ ...form, clinical: { ...form.clinical, category: e.target.value } })}><option value="">Selecione</option>{CATEGORIES.map(value => <option key={value}>{value}</option>)}<option>Outras</option></select></label>
      <label>Etiologia<select value={form.clinical.etiology} onChange={e => setForm({ ...form, clinical: { ...form.clinical, etiology: e.target.value } })}><option value="">Não informada</option>{ETIOLOGIES.map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Zoonose<select value={form.clinical.isZoonosis ? 'yes' : 'no'} onChange={e => setForm({ ...form, clinical: { ...form.clinical, isZoonosis: e.target.value === 'yes' } })}><option value="yes">Sim</option><option value="no">Não</option></select></label>
      <label>Nível de risco<select value={form.risk} onChange={e => setForm({ ...form, risk: e.target.value as ZoonosisFormData['risk'] })}><option>Alto</option><option>Médio</option><option>Baixo</option></select></label>
      <label>Transmissão<textarea value={form.transmission} onChange={e => setForm({ ...form, transmission: e.target.value })} /></label>
      <fieldset className="condition-checkboxes full-field"><legend>Sistemas envolvidos</legend>{SYSTEMS.map(value => <label key={value}><input type="checkbox" checked={form.clinical.systems.includes(value)} onChange={e => setForm({ ...form, clinical: { ...form.clinical, systems: e.target.checked ? [...form.clinical.systems, value] : form.clinical.systems.filter(item => item !== value) } })} />{value}</label>)}</fieldset>
      <fieldset className="condition-checkboxes full-field"><legend>Faixas etárias</legend>{AGES.map(value => <label key={value}><input type="checkbox" checked={form.clinical.ageGroups.includes(value)} onChange={e => setForm({ ...form, clinical: { ...form.clinical, ageGroups: e.target.checked ? [...form.clinical.ageGroups, value] : form.clinical.ageGroups.filter(item => item !== value) } })} />{value}</label>)}</fieldset>
      {([{ key: 'symptoms', label: 'Sinais clínicos', required: true }, { key: 'diagnostics', label: 'Exames sugeridos' }, { key: 'differentials', label: 'Diagnósticos diferenciais' }, { key: 'prevention', label: 'Prevenção e controle', required: true }, { key: 'protocols', label: 'Protocolos vinculados / condutas' }] as const).map(field => <label key={field.key}>{field.label}<textarea required={'required' in field && field.required} placeholder="Um item por linha" value={texts[field.key]} onChange={e => setTexts({ ...texts, [field.key]: e.target.value })} /></label>)}
      <label>Alerta clínico / revisão pendente<textarea value={form.clinical.alert} onChange={e => setForm({ ...form, clinical: { ...form.clinical, alert: e.target.value } })} placeholder="Deixe vazio se não houver alerta" /></label>
    </div><div className="form-actions"><button className="primary-button" type="submit">{saving ? 'Salvando…' : 'Salvar condição'}</button><button className="secondary-button" type="button" onClick={onCancel}>Cancelar</button></div></fieldset>
    {error && <p role="alert" className="consultation-message">{error}</p>}
  </form>
}
