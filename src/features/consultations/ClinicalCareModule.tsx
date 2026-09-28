import { useEffect, useRef, useState } from 'react'
import type { Appointment } from '../appointments/appointmentTypes'
import { consultationFromAppointment } from './consultationFromAppointment'
import { useConsultas } from '../../hooks/useConsultas'
import { ConsultationHeader } from './ConsultationHeader'
import { generateConsultationReport } from './consultationReport'
import { EMPTY_CONSULTATION } from './consultationTypes'
import type { ConsultationData, ConsultationStep } from './consultationTypes'
import { ClinicalHistoryStep } from './steps/ClinicalHistoryStep'
import { DiagnosisStep } from './steps/DiagnosisStep'
import { IdentificationStep } from './steps/IdentificationStep'
import { ComplementaryExamsStep } from './steps/ComplementaryExamsStep'
import { validateExam, type ExamDraft } from './examTypes'
import { PhysicalExamStep } from './steps/PhysicalExamStep'
import { useAppointments } from '../../hooks/useAppointments'
import type { Dog } from '../dogs/dogTypes'
import type { UserRole } from '../auth/LoginPage'
import { SupervisionGate } from './SupervisionGate'
import { cancelarLiberacao, listarVeterinarios } from './supervision'
import type { Liberacao, VeterinarianOption } from './supervision'

type ClinicalCareModuleProps = { dogs: Dog[]; initialAppointment?: Appointment; role?: UserRole; userEmail?: string }

function applyVeterinarian(data: ConsultationData, veterinarians: VeterinarianOption[], liberacao: Liberacao | null, userEmail?: string): ConsultationData {
  if (liberacao) return { ...data, veterinarian: liberacao.supervisor.nome, veterinarianId: String(liberacao.supervisor.medicoId) }
  if (data.veterinarianId && veterinarians.some((vet) => String(vet.medicoId) === data.veterinarianId)) return data
  const normalize = (value: string) => value.trim().toLocaleLowerCase('pt-BR')
  const vet = (data.veterinarian && veterinarians.find((item) => normalize(item.nome) === normalize(data.veterinarian)))
    || (userEmail && veterinarians.find((item) => normalize(item.email) === normalize(userEmail)))
  return vet ? { ...data, veterinarian: vet.nome, veterinarianId: String(vet.medicoId) } : { ...data, veterinarianId: '' }
}

export function ClinicalCareModule({ dogs, initialAppointment, role = 'veterinarian', userEmail }: ClinicalCareModuleProps) {
  const isStudent = role === 'attendant'
  const [step, setStep] = useState<ConsultationStep>(1)
  const [data, setData] = useState<ConsultationData>(() => initialAppointment ? consultationFromAppointment(initialAppointment, dogs) : EMPTY_CONSULTATION)
  const [exams, setExams] = useState<ExamDraft[]>([])
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const saveLock = useRef(false)
  const [completed, setCompleted] = useState<{ data: ConsultationData; exams: ExamDraft[]; id: number } | null>(null)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(initialAppointment?.id ?? null)
  const { salvarConsulta } = useConsultas()
  const { appointments, updateAppointment } = useAppointments()
  const [veterinarians, setVeterinarians] = useState<VeterinarianOption[]>([])
  const [liberacao, setLiberacao] = useState<Liberacao | null>(null)

  useEffect(() => {
    let active = true
    listarVeterinarios()
      .then((vets) => {
        if (!active) return
        setVeterinarians(vets)
        setData((current) => applyVeterinarian(current, vets, null, userEmail))
      })
      .catch(() => { if (active) setMessage('Não foi possível carregar a lista de veterinários.') })
    return () => { active = false }
  }, [userEmail])

  function handleLiberado(nova: Liberacao) {
    setLiberacao(nova)
    setData((current) => applyVeterinarian(current, veterinarians, nova, userEmail))
    setMessage('')
  }

  async function trocarLiberacao() {
    if (!liberacao || saving) return
    if (!window.confirm('Cancelar a liberação atual? Os dados preenchidos serão mantidos e será preciso uma nova liberação do professor.')) return
    try { await cancelarLiberacao(liberacao.id) } catch { setMessage('Não foi possível cancelar a liberação anterior.') }
    setLiberacao(null)
  }

  const availableAppointments = appointments
    .filter((item) => !['completed', 'cancelled', 'no-show'].includes(item.status))
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))

  function selectAppointment(id: number | null) {
    setSelectedAppointmentId(id)
    if (id === null) return
    const appointment = appointments.find((item) => item.id === id)
    if (!appointment) return
    setExams([])
    setData(current => applyVeterinarian(consultationFromAppointment(appointment, dogs, current), veterinarians, liberacao, userEmail))
    setMessage('Dados do agendamento carregados com sucesso.')
  }

  function update(key: keyof ConsultationData, value: string) {
    if ((key === 'dogName' || key === 'tutorName') && data[key] !== value) setExams([])
    setData((current) => ({ ...current, [key]: value }))
    setMessage('')
  }

  async function saveRecord() {
    if (saveLock.current || completed) return
    if (isStudent && !liberacao) {
      setMessage('O atendimento precisa da liberação do professor supervisor.')
      return
    }
    if (![data.dogName, data.tutorName, data.veterinarianId].every((value) => value.trim())) {
      setMessage('Preencha a identificação do paciente antes de finalizar.')
      setStep(1)
      return
    }
    const examError = exams.map(validateExam).find(Boolean)
    if (examError) { setMessage(examError); setStep(4); return }
    saveLock.current = true
    setSaving(true)
    setMessage('')
    try {
      const resultado = await salvarConsulta(data, null, exams, isStudent ? liberacao?.id ?? null : null)
      if (!resultado.sucesso || resultado.id === undefined) {
        setMessage(resultado.erro ?? 'Não foi possível salvar o atendimento. Os dados preenchidos foram mantidos.')
        return
      }
      setCompleted({ data: { ...data }, exams: structuredClone(exams), id: resultado.id })
      setMessage('Atendimento finalizado e salvo no prontuário.')
      if (selectedAppointmentId !== null) {
        try {
          const updated = await updateAppointment(selectedAppointmentId, { status: 'completed' })
          if (!updated) setMessage('Atendimento salvo. Não foi possível atualizar a agenda; confira o agendamento separadamente.')
        }
        catch { setMessage('Atendimento salvo. Não foi possível atualizar a agenda; confira o agendamento separadamente.') }
      }
    } catch {
      setMessage('Não foi possível finalizar o atendimento. Verifique a conexão e tente novamente.')
    } finally {
      saveLock.current = false
      setSaving(false)
    }
  }

  function startNew() {
    setCompleted(null)
    setExams([])
    setLiberacao(null)
    setData(applyVeterinarian(EMPTY_CONSULTATION, veterinarians, null, userEmail))
    setSelectedAppointmentId(null)
    setStep(1)
    setMessage('')
  }

  if (completed) return <section className="consultation-panel content-card">
    <h2>Atendimento finalizado</h2>
    <p>Atendimento nº {completed.id} de <strong>{completed.data.dogName}</strong> salvo no prontuário.</p>
    <p>Para emitir uma receita, acesse a aba Receituário.</p>
    <div className="form-actions">
      <button className="secondary-button" onClick={() => setMessage(generateConsultationReport(completed.data, completed.exams) ? 'Relatório clínico aberto.' : 'O navegador bloqueou o relatório. Permita novas janelas e tente novamente.')}>Gerar relatório clínico</button>
      <button className="secondary-button" disabled={saving} onClick={startNew}>Novo atendimento</button>
    </div>
    {message && <p className="consultation-message" role="status">{message}</p>}
  </section>
  if (isStudent && !liberacao) return <SupervisionGate onLiberado={handleLiberado} />
  return (
    <section className="clinical-care-module">
      {liberacao && <aside className="profile-notice">
        <span>✔</span>
        <p>
          <strong>Atendimento liberado por {liberacao.supervisor.nome}</strong>
          {liberacao.participantes.length > 0 && <> · Participantes: {liberacao.participantes.map((p) => p.nome).join(', ')}</>}
          {' '}<button type="button" className="text-back-button" onClick={() => void trocarLiberacao()} disabled={saving}>Trocar liberação</button>
        </p>
      </aside>}
      <fieldset className="consultation-edit-fields" disabled={saving}>
      <ConsultationHeader currentStep={step} onStepChange={setStep} />
      {step === 1 && <IdentificationStep data={data} appointments={availableAppointments} selectedAppointmentId={selectedAppointmentId} onSelectAppointment={selectAppointment} update={update} onNext={() => setStep(2)} veterinarians={veterinarians} veterinarianLocked={isStudent} />}
      {step === 2 && <ClinicalHistoryStep data={data} update={update} onBack={() => setStep(1)} onNext={() => setStep(3)} />}
      {step === 3 && <PhysicalExamStep data={data} update={update} onBack={() => setStep(2)} onNext={() => setStep(4)} />}
      {step === 4 && <ComplementaryExamsStep exams={exams} onChange={setExams} onBack={() => setStep(3)} onNext={() => setStep(5)} />}
      {step === 5 && <DiagnosisStep data={data} update={update} onBack={() => setStep(4)} />}
      </fieldset>
      {message && <p className="consultation-message" role="status">{message}</p>}
      <div className="consultation-actions">
        <button className="record-button" disabled={saving} onClick={saveRecord}>{saving ? 'Salvando atendimento...' : 'Finalizar atendimento e salvar no prontuário'}</button>

      </div>
    </section>
  )
}
