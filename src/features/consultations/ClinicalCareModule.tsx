import { useEffect, useRef, useState } from 'react'
import { useAppointments } from '../../hooks/useAppointments'
import { useConsultas } from '../../hooks/useConsultas'
import type { Appointment } from '../appointments/appointmentTypes'
import type { UserRole } from '../auth/profile'
import type { Dog } from '../dogs/dogTypes'
import { SupervisionGate } from '../supervision/gate/SupervisionGate'
import { cancelarLiberacao, listarVeterinarios } from '../supervision/supervision'
import type { Liberacao, VeterinarianOption } from '../supervision/supervisionTypes'
import { CareCompleted, type CompletedCare } from './CareCompleted'
import { applyVeterinarian, openAppointments, validateConsultation } from './careRules'
import { ConsultationHeader } from './ConsultationHeader'
import { consultationFromAppointment } from './consultationFromAppointment'
import { EMPTY_CONSULTATION } from './consultationTypes'
import type { ConsultationData, ConsultationStep } from './consultationTypes'
import type { ExamDraft } from './examTypes'
import { LiberationNotice } from './LiberationNotice'
import { ClinicalHistoryStep } from './steps/ClinicalHistoryStep'
import { ComplementaryExamsStep } from './steps/ComplementaryExamsStep'
import { DiagnosisStep } from './steps/DiagnosisStep'
import { IdentificationStep } from './steps/IdentificationStep'
import { PhysicalExamStep } from './steps/PhysicalExamStep'

type ClinicalCareModuleProps = {
  dogs: Dog[]
  initialAppointment?: Appointment
  role?: UserRole
  userEmail?: string
  onOpenRecord?: (petId: number) => void
}

const AGENDA_NOT_UPDATED =
  'Atendimento salvo. Não foi possível atualizar a agenda; confira o agendamento separadamente.'

export function ClinicalCareModule({
  dogs,
  initialAppointment,
  role = 'veterinarian',
  userEmail,
  onOpenRecord,
}: ClinicalCareModuleProps) {
  const isStudent = role === 'attendant'
  const [step, setStep] = useState<ConsultationStep>(1)
  const [data, setData] = useState<ConsultationData>(() =>
    initialAppointment ? consultationFromAppointment(initialAppointment, dogs) : EMPTY_CONSULTATION,
  )
  const [exams, setExams] = useState<ExamDraft[]>([])
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const saveLock = useRef(false)
  const [completed, setCompleted] = useState<CompletedCare | null>(null)
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
      .catch(() => {
        if (active) setMessage('Não foi possível carregar a lista de veterinários.')
      })
    return () => {
      active = false
    }
  }, [userEmail])

  function handleLiberado(nova: Liberacao) {
    setLiberacao(nova)
    setData((current) => applyVeterinarian(current, veterinarians, nova, userEmail))
    setMessage('')
  }

  async function trocarLiberacao() {
    if (!liberacao || saving) return
    const confirmed = window.confirm(
      'Cancelar a liberação atual? Os dados preenchidos serão mantidos e será preciso uma nova liberação do professor.',
    )
    if (!confirmed) return
    try {
      await cancelarLiberacao(liberacao.id)
    } catch {
      setMessage('Não foi possível cancelar a liberação anterior.')
    }
    setLiberacao(null)
  }

  function selectAppointment(id: number | null) {
    setSelectedAppointmentId(id)
    if (id === null) return
    const appointment = appointments.find((item) => item.id === id)
    if (!appointment) return
    setExams([])
    setData((current) =>
      applyVeterinarian(consultationFromAppointment(appointment, dogs, current), veterinarians, liberacao, userEmail),
    )
    setMessage('Dados do agendamento carregados com sucesso.')
  }

  function update(key: keyof ConsultationData, value: string) {
    if ((key === 'dogName' || key === 'tutorName') && data[key] !== value) setExams([])
    setData((current) => ({ ...current, [key]: value }))
    setMessage('')
  }

  async function completeAppointment() {
    if (selectedAppointmentId === null) return
    try {
      if (!(await updateAppointment(selectedAppointmentId, { status: 'completed' }))) setMessage(AGENDA_NOT_UPDATED)
    } catch {
      setMessage(AGENDA_NOT_UPDATED)
    }
  }

  async function saveRecord() {
    if (saveLock.current || completed) return
    if (isStudent && !liberacao) {
      setMessage('O atendimento precisa da liberação do professor supervisor.')
      return
    }
    const invalid = validateConsultation(data, exams)
    if (invalid) {
      setMessage(invalid.message)
      setStep(invalid.step)
      return
    }
    saveLock.current = true
    setSaving(true)
    setMessage('')
    try {
      const resultado = await salvarConsulta(data, exams, isStudent ? (liberacao?.id ?? null) : null)
      if (!resultado.sucesso || resultado.id === undefined) {
        setMessage(resultado.erro ?? 'Não foi possível salvar o atendimento. Os dados preenchidos foram mantidos.')
        return
      }
      setCompleted({ data: { ...data }, exams: structuredClone(exams), id: resultado.id, petId: resultado.petId })
      setMessage('Atendimento finalizado e salvo no prontuário.')
      await completeAppointment()
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

  if (completed)
    return (
      <CareCompleted
        completed={completed}
        message={message}
        onMessage={setMessage}
        onNew={startNew}
        newDisabled={saving}
        onOpenRecord={onOpenRecord}
      />
    )
  if (isStudent && !liberacao) return <SupervisionGate onLiberado={handleLiberado} />
  return (
    <section className="clinical-care-module">
      {liberacao && (
        <LiberationNotice liberacao={liberacao} onChange={() => void trocarLiberacao()} disabled={saving} />
      )}
      <fieldset className="consultation-edit-fields" disabled={saving}>
        <ConsultationHeader currentStep={step} onStepChange={setStep} />
        {step === 1 && (
          <IdentificationStep
            data={data}
            appointments={openAppointments(appointments)}
            selectedAppointmentId={selectedAppointmentId}
            onSelectAppointment={selectAppointment}
            update={update}
            onNext={() => setStep(2)}
            veterinarians={veterinarians}
            veterinarianLocked={isStudent}
          />
        )}
        {step === 2 && (
          <ClinicalHistoryStep data={data} update={update} onBack={() => setStep(1)} onNext={() => setStep(3)} />
        )}
        {step === 3 && (
          <PhysicalExamStep data={data} update={update} onBack={() => setStep(2)} onNext={() => setStep(4)} />
        )}
        {step === 4 && (
          <ComplementaryExamsStep
            exams={exams}
            onChange={setExams}
            onBack={() => setStep(3)}
            onNext={() => setStep(5)}
          />
        )}
        {step === 5 && <DiagnosisStep data={data} update={update} onBack={() => setStep(4)} />}
      </fieldset>
      {message && (
        <p className="consultation-message" role="status">
          {message}
        </p>
      )}
      <div className="consultation-actions">
        <button className="record-button" disabled={saving} onClick={saveRecord}>
          {saving ? 'Salvando atendimento...' : 'Finalizar atendimento e salvar no prontuário'}
        </button>
      </div>
    </section>
  )
}
