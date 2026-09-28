import { useEffect, useRef, useState } from 'react'
import { ConsultaService } from '../../services/ConsultaService'
import type { UserRole } from '../auth/LoginPage'
import { SupervisionGate } from '../consultations/SupervisionGate'
import { cancelarLiberacao } from '../consultations/supervision'
import type { Liberacao } from '../consultations/supervision'
import type { ConsultationData } from '../consultations/consultationTypes'
import { ClinicalHistoryStep } from '../consultations/steps/ClinicalHistoryStep'
import { PhysicalExamStep } from '../consultations/steps/PhysicalExamStep'
import { DiagnosisStep } from '../consultations/steps/DiagnosisStep'
import { consultaToData, dataToCampos, retificarConsulta } from './retification'

const consultaService = new ConsultaService()

type RetificationEditorProps = {
  consultaId: number
  role: UserRole
  onDone: (message: string) => void
  onCancel: () => void
}

const STEPS = ['Histórico clínico', 'Exame físico', 'Diagnóstico, conduta e alta'] as const

export function RetificationEditor({ consultaId, role, onDone, onCancel }: RetificationEditorProps) {
  const isStudent = role === 'attendant'
  const [data, setData] = useState<ConsultationData | null>(null)
  const [step, setStep] = useState(0)
  const [motivo, setMotivo] = useState('')
  const [liberacao, setLiberacao] = useState<Liberacao | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [loadError, setLoadError] = useState('')
  const saveLock = useRef(false)

  useEffect(() => {
    let active = true
    consultaService.buscarPorId(consultaId)
      .then((consulta) => {
        if (!active) return
        if (!consulta) { setLoadError('Atendimento não encontrado.'); return }
        setData(consultaToData(consulta))
      })
      .catch(() => { if (active) setLoadError('Não foi possível carregar o atendimento.') })
    return () => { active = false }
  }, [consultaId])

  function update(key: keyof ConsultationData, value: string) {
    setData((current) => current ? { ...current, [key]: value } : current)
    setMessage('')
  }

  async function cancelar() {
    if (liberacao) await cancelarLiberacao(liberacao.id).catch(() => {})
    onCancel()
  }

  async function salvar() {
    if (!data || saveLock.current) return
    if (!motivo.trim()) { setMessage('Informe o motivo da retificação.'); return }
    saveLock.current = true
    setSaving(true)
    setMessage('')
    try {
      const versao = await retificarConsulta(consultaId, dataToCampos(data), motivo.trim(), liberacao?.id ?? null)
      onDone(`Atendimento nº ${consultaId} retificado. A versão anterior foi arquivada (versão atual: ${versao}).`)
    } catch (error) {
      setMessage((error as Error).message)
    } finally {
      saveLock.current = false
      setSaving(false)
    }
  }

  if (loadError) {
    return <section className="consultation-panel content-card"><p>{loadError}</p><button className="secondary-button" onClick={onCancel}>Voltar</button></section>
  }
  if (!data) return <section className="consultation-panel content-card"><p>Carregando atendimento...</p></section>
  if (isStudent && !liberacao) return <SupervisionGate consultaId={consultaId} onLiberado={setLiberacao} onCancel={onCancel} />

  return (
    <section className="clinical-care-module">
      <header className="consultation-header content-card">
        <h2>Retificar atendimento nº {consultaId}</h2>
        <p>{data.dogName} · Tutor: {data.tutorName} · Veterinário: {data.veterinarian}</p>
        <p style={{ color: '#6b7280' }}>A versão atual será arquivada e continuará visível no prontuário. Exames complementares são atualizados pelo próprio prontuário.</p>
        {liberacao && <p><strong>Retificação liberada por {liberacao.supervisor.nome}</strong></p>}
        <nav className="consultation-steps" aria-label="Etapas da retificação">
          {STEPS.map((label, index) => (
            <button key={label} className={step === index ? 'active' : ''} onClick={() => setStep(index)}>{index + 1}. {label}</button>
          ))}
        </nav>
      </header>

      <fieldset className="consultation-edit-fields" disabled={saving}>
        {step === 0 && <ClinicalHistoryStep data={data} update={update} onBack={() => void cancelar()} onNext={() => setStep(1)} />}
        {step === 1 && <PhysicalExamStep data={data} update={update} onBack={() => setStep(0)} onNext={() => setStep(2)} />}
        {step === 2 && <DiagnosisStep data={data} update={update} onBack={() => setStep(1)} />}
      </fieldset>

      <section className="consultation-panel content-card">
        <div className="consultation-textareas">
          <label>Motivo da retificação *
            <textarea value={motivo} onChange={(event) => { setMotivo(event.target.value); setMessage('') }} placeholder="Ex.: correção da temperatura registrada; inclusão do resultado do exame no diagnóstico" disabled={saving} />
          </label>
        </div>
        {message && <p className="consultation-message" role="status">{message}</p>}
        <div className="step-navigation">
          <button className="secondary-button" onClick={() => void cancelar()} disabled={saving}>Cancelar</button>
          <button className="primary-button" onClick={() => void salvar()} disabled={saving}>{saving ? 'Salvando...' : 'Salvar retificação'}</button>
        </div>
      </section>
    </section>
  )
}
