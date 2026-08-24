import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Icon } from '../../components/common/Icon'
import { INITIAL_MEDICATIONS } from './medicationData'
import type { Medication, MedicationFormData } from './medicationTypes'

const EMPTY_FORM: MedicationFormData = { commercialName: '', activeIngredient: '', indications: '', dosage: '', doseMgKg: 0, frequency: 'SID (uma vez ao dia)', route: 'Oral', concentration: '', concentrationMgMl: null, contraindications: '', notes: '' }
const splitList = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean)

function PillIcon() { return <Icon><path d="M8.5 19.5a5 5 0 0 1-7-7l7-7a5 5 0 0 1 7 7zM6 8l7 7" /></Icon> }
function SearchIcon() { return <Icon><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></Icon> }
function CalculatorIcon() { return <Icon><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M8 6h8v3H8zm0 7h1m3 0h1m3 0h1m-9 4h1m3 0h1m3 0h1" /></Icon> }

export function MedicationsModule() {
  const [items, setItems] = useState(INITIAL_MEDICATIONS)
  const [screen, setScreen] = useState<'browse' | 'create'>('browse')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const filtered = useMemo(() => items.filter((item) => `${item.commercialName} ${item.activeIngredient} ${item.indications.join(' ')}`.toLocaleLowerCase('pt-BR').includes(query.trim().toLocaleLowerCase('pt-BR'))), [items, query])
  const selected = items.find((item) => item.id === selectedId) ?? null

  function update<K extends keyof MedicationFormData>(key: K, value: MedicationFormData[K]) { setForm((current) => ({ ...current, [key]: value })) }
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const medication: Medication = { ...form, id: Math.max(0, ...items.map((item) => item.id)) + 1, indications: splitList(form.indications), contraindications: splitList(form.contraindications), concentrationMgMl: form.concentrationMgMl || null }
    setItems((current) => [...current, medication]); setSelectedId(medication.id); setScreen('browse'); setForm(EMPTY_FORM)
  }

  return <section className="medications-module">
    <header className="medications-header content-card">
      <div><h2><PillIcon />Guia Terapêutico e Calculadora</h2><p>Consulte medicamentos por princípio ativo ou indicação clínica e calcule doses precisas para cães.</p></div>
      <div className="medication-header-actions"><button className={screen === 'browse' ? 'primary-button' : 'outline-button'} onClick={() => setScreen('browse')}><SearchIcon />Consultar</button><button className={screen === 'create' ? 'primary-button' : 'outline-button'} onClick={() => setScreen('create')}><span>＋</span>Cadastrar Medicamento</button></div>
      {screen === 'browse' && <label className="medication-search"><SearchIcon /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por princípio ativo ou indicação..." /></label>}
    </header>

    {screen === 'create' ? <form className="medication-form content-card" onSubmit={save}><div><h3>Cadastrar novo medicamento</h3><p>Adicione as informações terapêuticas para consulta da equipe veterinária.</p></div><div className="medication-form-grid">
      <label>Nome comercial<input required value={form.commercialName} onChange={(e) => update('commercialName', e.target.value)} /></label><label>Princípio ativo<input required value={form.activeIngredient} onChange={(e) => update('activeIngredient', e.target.value)} /></label>
      <label className="full-field">Indicações clínicas<input required value={form.indications} onChange={(e) => update('indications', e.target.value)} placeholder="Separe por vírgulas" /></label><label>Dosagem exibida<input required value={form.dosage} onChange={(e) => update('dosage', e.target.value)} placeholder="Ex.: 2 mg/kg" /></label><label>Dose para cálculo (mg/kg)<input required min="0" step="0.01" type="number" value={form.doseMgKg || ''} onChange={(e) => update('doseMgKg', Number(e.target.value))} /></label>
      <label>Frequência<input required value={form.frequency} onChange={(e) => update('frequency', e.target.value)} /></label><label>Via<input required value={form.route} onChange={(e) => update('route', e.target.value)} /></label><label>Concentração exibida<input required value={form.concentration} onChange={(e) => update('concentration', e.target.value)} placeholder="Ex.: 30 mg/mL" /></label><label>Concentração líquida (mg/mL, opcional)<input min="0" step="0.01" type="number" value={form.concentrationMgMl ?? ''} onChange={(e) => update('concentrationMgMl', e.target.value ? Number(e.target.value) : null)} /></label>
      <label className="full-field">Contraindicações<input value={form.contraindications} onChange={(e) => update('contraindications', e.target.value)} placeholder="Separe por vírgulas" /></label><label className="full-field">Observações<textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} /></label>
    </div><div className="form-actions"><button className="primary-button" type="submit">Cadastrar medicamento</button><button className="secondary-button" type="button" onClick={() => setScreen('browse')}>Cancelar</button></div></form> : <div className="medication-browser"><div className="medication-list">{filtered.map((item) => <button key={item.id} className={`medication-card${selectedId === item.id ? ' selected' : ''}`} onClick={() => setSelectedId(item.id)}><span className="medication-card-icon"><PillIcon /></span><span><strong>{item.commercialName}</strong><small>{item.activeIngredient}</small><span className="medication-indications"><b>Indicações:</b> {item.indications.join(', ')}</span><span className="medication-tags"><em>{item.dosage}</em><em>{item.frequency}</em></span></span></button>)}{filtered.length === 0 && <div className="medication-empty-list">Nenhum medicamento encontrado.</div>}</div><MedicationDetails medication={selected} /></div>}
  </section>
}

function MedicationDetails({ medication }: { medication: Medication | null }) {
  const [weight, setWeight] = useState('')
  const [result, setResult] = useState<string | null>(null)
  if (!medication) return <aside className="medication-details empty"><PillIcon /><p>Selecione um medicamento ao lado para ver os detalhes e calcular a dose</p></aside>
  function calculate() { const kg = Number(weight.replace(',', '.')); if (!kg || kg <= 0) return setResult('Informe um peso válido.'); const mg = kg * medication!.doseMgKg; const volume = medication!.concentrationMgMl ? ` (${(mg / medication!.concentrationMgMl).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} mL)` : ''; setResult(`${mg.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} mg por administração${volume}`) }
  return <aside className="medication-details" key={medication.id}><h3>{medication.commercialName}</h3><p className="active-ingredient">{medication.activeIngredient}</p><div className="medication-summary"><p><b>Dosagem:</b> {medication.dosage}</p><p><b>Frequência:</b> {medication.frequency}</p><p><b>Via:</b> {medication.route}</p><p><b>Concentração:</b> {medication.concentration}</p></div><section className="medication-section"><h4>Indicações Clínicas</h4><ul>{medication.indications.map((item) => <li key={item}>{item}</li>)}</ul></section>{medication.contraindications.length > 0 && <section className="medication-alert"><h4><span>△</span>Contraindicações</h4><ul>{medication.contraindications.map((item) => <li key={item}>{item}</li>)}</ul></section>}<section className="medication-notes"><h4>Observações</h4><p>{medication.notes || 'Sem observações adicionais.'}</p></section><section className="dose-calculator"><h4><CalculatorIcon />Calculadora de Dose</h4><label>Peso do Animal (kg)<input inputMode="decimal" value={weight} onChange={(event) => { setWeight(event.target.value); setResult(null) }} placeholder="Ex: 25.5" /></label><button type="button" onClick={calculate}><CalculatorIcon />Calcular Dose</button>{result && <output>{result}</output>}</section></aside>
}
