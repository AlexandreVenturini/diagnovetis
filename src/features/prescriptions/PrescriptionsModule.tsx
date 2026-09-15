import { useEffect, useRef, useState } from 'react'
import type { Dog } from '../dogs/dogTypes'
import type { Medico } from '../../models/Medico'
import type { Medicamento } from '../../models/Medicamento'
import { MedicoService } from '../../services/MedicoService'
import { MedicamentoService } from '../../services/MedicamentoService'
import { PrescriptionService, type IssuedPrescription } from '../../services/PrescriptionService'
import { EMPTY_CONSULTATION } from '../consultations/consultationTypes'
import { emptyPrescription, emptyPrescriptionItem, generatePrescription, prescriptionHtml, validatePrescription } from '../consultations/prescriptionReport'
import { PrescriptionEditor } from '../consultations/PrescriptionEditor'
import { calculateDose } from './doseCalculation'

const service = new PrescriptionService()
const number = (value: string) => Number(value.replace(',', '.'))
const format = (value: number) => value.toLocaleString('pt-BR', { maximumSignificantDigits: 8 })

export function PrescriptionsModule({ dogs, onOpenRecord }: { dogs: Dog[]; onOpenRecord: (id: number) => void }) {
  const [tab, setTab] = useState<'history' | 'new'>('history')
  const [history, setHistory] = useState<IssuedPrescription[]>([])
  const [medicos, setMedicos] = useState<Medico[]>([])
  const [medications, setMedications] = useState<Medicamento[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reload, setReload] = useState(0)
  const [query, setQuery] = useState('')
  const [date, setDate] = useState('')
  const [selected, setSelected] = useState<IssuedPrescription | null>(null)
  const [petId, setPetId] = useState('')
  const [vetId, setVetId] = useState('')
  const [weight, setWeight] = useState('')
  const [prescription, setPrescription] = useState(emptyPrescription)
  const [medQuery, setMedQuery] = useState('')
  const [mgKg, setMgKg] = useState('')
  const [concentration, setConcentration] = useState('')
  const [targetItem, setTargetItem] = useState(0)
  const [preview, setPreview] = useState(false)
  const [message, setMessage] = useState('')
  const [pendingEmission, setPendingEmission] = useState(false)
  const [saving, setSaving] = useState(false)
  const lock = useRef(false)
  const pending = useRef<Parameters<PrescriptionService['issue']> | null>(null)
  const dog = dogs.find(item => item.id === Number(petId))
  const vet = medicos.find(item => item.id === Number(vetId))
  const patient = { ...EMPTY_CONSULTATION, dogName: dog?.name ?? '', tutorName: dog?.tutor ?? '', breed: dog?.breed ?? '', age: dog?.age ?? '', veterinarian: vet?.nome ?? '', weight, patientId: petId }
  const calculation = calculateDose(number(weight), number(mgKg), number(concentration))

  useEffect(() => {
    let active = true
    Promise.all([service.list(), new MedicoService().listarMedicos(), new MedicamentoService().listarMedicamentos()]).then(([rows, vets, meds]) => {
      if (active) { setHistory(rows); setMedicos(vets); setMedications(meds); setLoadError(''); setLoading(false) }
    }).catch(error => { if (active) { setLoadError(error.message); setLoading(false) } })
    return () => { active = false }
  }, [reload])

  function startNew() {
    setPetId(''); setVetId(''); setWeight(''); setPrescription(emptyPrescription()); setPreview(false)
    setMgKg(''); setConcentration(''); setTargetItem(0); setMedQuery(''); setMessage(''); setSelected(null); pending.current = null; setPendingEmission(false); setTab('new')
  }

  function review() {
    const error = validatePrescription(patient, prescription)
    if (error || !Number.isFinite(number(weight)) || number(weight) <= 0) { setMessage(error || 'Informe um peso válido em kg.'); return }
    setMessage(''); setPreview(true)
  }

  async function issue() {
    if (lock.current || !dog || !vet) return
    lock.current = true; setSaving(true); setMessage('')
    try {
      pending.current ??= [crypto.randomUUID(), dog.id, vet.id, { version: 1, issuedAt: new Date().toISOString(), patient: { ...patient }, prescription: structuredClone(prescription) }]
      setPendingEmission(true)
      const row = await service.issue(...pending.current)
      setHistory(current => [row, ...current.filter(item => item.id !== row.id)])
      setSelected(row); setTab('history'); setPreview(false); pending.current = null; setPendingEmission(false)
      setPetId(''); setVetId(''); setWeight(''); setPrescription(emptyPrescription()); setMgKg(''); setConcentration(''); setTargetItem(0); setMedQuery('')
      setMessage('Receita emitida e salva no prontuário do animal.')
    } catch (error) { setMessage((error as Error).message) }
    finally { lock.current = false; setSaving(false) }
  }

  function print(row: IssuedPrescription) {
    try { setMessage(generatePrescription(row.snapshot.patient, row.snapshot.prescription, new Date(row.snapshot.issuedAt)) ? 'Receita aberta. Use Imprimir / Salvar PDF.' : 'Permita novas janelas no navegador para imprimir.') }
    catch { setMessage('Não foi possível abrir esta receita. Confira os dados salvos.') }
  }

  const filtered = history.filter(row => {
    const { patient: p, prescription: rx } = row.snapshot
    return `${p.dogName} ${p.tutorName} ${p.veterinarian} ${rx.crmv} ${rx.items.map(item => item.medication).join(' ')}`.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR').trim()) && (!date || new Date(row.snapshot.issuedAt).toLocaleDateString('sv-SE') === date)
  })

  return <section className="receituario-module">
    <div className="records-heading"><div><h2>Receituário</h2><p>Emita receitas e acompanhe o histórico de cada animal.</p></div></div>
    <div className="form-actions" role="group" aria-label="Receituário">
      <button className={tab === 'history' ? 'primary-button' : 'secondary-button'} disabled={saving} onClick={() => { setTab('history'); setMessage('') }}>Histórico</button>
      <button className={tab === 'new' ? 'primary-button' : 'secondary-button'} disabled={saving} onClick={() => { if (selected) startNew(); else setTab('new') }}>Nova receita</button>
    </div>
    {message && <p role="status" className="consultation-message">{message}</p>}
    {loading ? <p role="status">Carregando receituário…</p> : loadError ? <div role="alert"><p>{loadError}</p><button className="secondary-button" onClick={() => { setLoading(true); setReload(value => value + 1) }}>Tentar novamente</button></div> : tab === 'history' ? <>
      <div className="content-card consultation-form-grid rx-filters"><label>Buscar receitas<input value={query} onChange={event => setQuery(event.target.value)} placeholder="Animal, tutor, veterinário ou medicamento" /></label><label>Data de emissão<input type="date" value={date} onChange={event => setDate(event.target.value)} /></label></div>
      {selected ? <section className="content-card rx-details"><button className="text-back-button" onClick={() => setSelected(null)}>‹ Voltar ao histórico</button><h3>Receita de {selected.snapshot.patient.dogName}</h3><p>{new Date(selected.snapshot.issuedAt).toLocaleString('pt-BR')} · {selected.snapshot.patient.veterinarian}</p>
        <iframe className="rx-preview" title="Detalhes da receita emitida" sandbox="" srcDoc={prescriptionHtml(selected.snapshot.patient, selected.snapshot.prescription, new Date(selected.snapshot.issuedAt))} />
        <div className="form-actions"><button className="primary-button" onClick={() => print(selected)}>PDF / Impressão</button><button className="secondary-button" onClick={() => onOpenRecord(selected.petId)}>Abrir prontuário</button><button className="secondary-button" onClick={startNew}>Nova receita</button></div>
      </section> : <div className="rx-history">{!filtered.length && <p>Nenhuma receita encontrada.</p>}{filtered.map(row => <article className="content-card" key={row.id}><h3>{row.snapshot.patient.dogName}</h3><p>Tutor: {row.snapshot.patient.tutorName}</p><p>{new Date(row.snapshot.issuedAt).toLocaleDateString('pt-BR')} · {row.snapshot.patient.veterinarian}</p><p>{row.snapshot.prescription.items.map(item => item.medication).join(', ')}</p><button className="outline-button" onClick={() => { setSelected(row); setMessage('') }}>Ver detalhes</button></article>)}</div>}
    </> : <>
      <p className="rx-flow">Identificação → Medicamentos e dose → Orientações → Visualização → Emissão</p>
      {preview ? <section className="content-card rx-details"><h3>Revise a receita antes de emitir</h3><iframe title="Visualização da nova receita" className="rx-preview" sandbox="" srcDoc={prescriptionHtml(patient, prescription)} /><p>Confira os dados e as doses. A emissão salva uma cópia no prontuário.</p><div className="form-actions"><button className="secondary-button" disabled={saving || pendingEmission} onClick={() => setPreview(false)}>Voltar e editar</button><button className="primary-button" disabled={saving} onClick={issue}>{saving ? 'Emitindo…' : pendingEmission ? 'Tentar emissão novamente' : 'Emitir e salvar no prontuário'}</button></div>{pendingEmission && !saving && <p>A emissão ainda não foi confirmada. Tente novamente para verificar e concluir a mesma receita.</p>}</section> : <>
        <section className="content-card consultation-panel"><h3>1. Animal, tutor e veterinário</h3><div className="consultation-form-grid">
          <label>Selecionar animal<select value={petId} onChange={event => { const next = dogs.find(item => item.id === Number(event.target.value)); setPetId(event.target.value); setWeight(next?.weight ?? ''); setPrescription(current => ({ ...emptyPrescription(), crmv: current.crmv })); setMgKg(''); setConcentration(''); setTargetItem(0) }}><option value="">Selecione um animal</option>{dogs.map(item => <option key={item.id} value={item.id}>{item.name} — {item.tutor} (#{item.id})</option>)}</select></label>
          <label>Tutor<input readOnly value={dog?.tutor ?? ''} /></label><label>Identificação<input readOnly value={dog ? `#${dog.id} · ${dog.breed} · ${dog.sex}` : ''} /></label><label>Peso atual (kg)<input inputMode="decimal" value={weight} onChange={event => { setWeight(event.target.value); setMgKg('') }} /></label>
          <label>Veterinário<select value={vetId} onChange={event => { setVetId(event.target.value); setPrescription(current => ({ ...current, crmv: medicos.find(item => item.id === Number(event.target.value))?.crmv ?? '' })) }}><option value="">Selecione o veterinário</option>{medicos.map(item => <option key={item.id} value={item.id}>{item.nome} — {item.crmv}</option>)}</select></label>
        </div></section>
        <section className="content-card consultation-panel"><h3>2. Buscar medicamento</h3><label className="rx-medication-search">Nome ou princípio ativo<input value={medQuery} onChange={event => setMedQuery(event.target.value)} placeholder="Digite para buscar no cadastro" /></label>
          {medQuery.trim() && <ul className="rx-medications">{medications.filter(item => `${item.nome} ${item.principioAtivo}`.toLocaleLowerCase('pt-BR').includes(medQuery.toLocaleLowerCase('pt-BR'))).map(item => <li key={item.id}><span>{item.nome} · {item.concentracao} {item.unidadeConcentracao} · {item.formaFarmaceutica}</span><button className="secondary-button" onClick={() => {
            const added = { ...emptyPrescriptionItem(), medication: `${item.nome} — ${item.concentracao} ${item.unidadeConcentracao} — ${item.formaFarmaceutica}`, route: item.viaAdministracao }
            const items = prescription.items.filter(current => Object.values(current).some(value => value.trim()))
            setPrescription({ ...prescription, items: [...items, added] }); setTargetItem(items.length); setMgKg(''); setConcentration(item.unidadeConcentracao.toLowerCase().replaceAll(' ', '') === 'mg/ml' ? String(item.concentracao) : ''); setMedQuery('')
          }}>Adicionar</button></li>)}</ul>}
          {!medications.length && <p>Nenhum medicamento cadastrado. Você pode preencher o nome e a apresentação abaixo.</p>}
        </section>
        <section className="content-card consultation-panel"><h3>3. Calcular dose (opcional)</h3><p>Conversão para soluções em mg/mL. Informe a dose em mg/kg por administração definida pelo veterinário.</p><div className="consultation-form-grid">
          <label>Medicamento do cálculo<select value={targetItem} onChange={event => { setTargetItem(Number(event.target.value)); setMgKg(''); setConcentration('') }}>{prescription.items.map((item, index) => <option key={index} value={index}>{index + 1}. {item.medication || 'Medicamento sem nome'}</option>)}</select></label>
          <label>Dose (mg/kg por administração)<input inputMode="decimal" value={mgKg} onChange={event => setMgKg(event.target.value)} /></label><label>Concentração (mg/mL)<input inputMode="decimal" value={concentration} onChange={event => setConcentration(event.target.value)} /></label>
        </div>{calculation && <p>{weight} kg × {mgKg} mg/kg = <strong>{format(calculation.mg)} mg</strong> → <strong>{format(calculation.ml)} mL por administração</strong></p>}
          <button className="primary-button rx-dose-apply" disabled={!calculation || !prescription.items[targetItem]?.medication.trim()} onClick={() => { if (calculation) { setPrescription(current => ({ ...current, items: current.items.map((item, index) => index === targetItem ? { ...item, dose: `${format(calculation.ml)} mL (${format(calculation.mg)} mg) por administração` } : item) })); setMessage('Dose aplicada. Confira o valor no medicamento antes de emitir.') } }}>Aplicar dose ao medicamento</button>
        </section>
        <PrescriptionEditor value={prescription} onChange={value => { setPrescription(value); if (value.items.length !== prescription.items.length) { setTargetItem(0); setMgKg(''); setConcentration('') } }} />
        <div className="form-actions"><button className="primary-button" onClick={review}>Visualizar receita</button></div>
      </>}
    </>}
  </section>
}
