import { useRef, useState } from 'react'
import { useConsultas } from '../../hooks/useConsultas'
import { ConsultationHeader } from './ConsultationHeader'
import { generateConsultationReport } from './consultationReport'
import { EMPTY_CONSULTATION } from './consultationTypes'
import type { ConsultationData, ConsultationStep } from './consultationTypes'
import { ClinicalHistoryStep } from './steps/ClinicalHistoryStep'
import { DiagnosisStep } from './steps/DiagnosisStep'
import { IdentificationStep } from './steps/IdentificationStep'
import { PhysicalExamStep } from './steps/PhysicalExamStep'
import { useAppointments } from '../../hooks/useAppointments'
import type { Dog } from '../dogs/dogTypes'


type ClinicalCareModuleProps = { dogs: Dog[] }

export function ClinicalCareModule({ dogs }: ClinicalCareModuleProps) {
  const [step, setStep] = useState<ConsultationStep>(1)
  const [data, setData] = useState<ConsultationData>(EMPTY_CONSULTATION)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const saveLock = useRef(false)
  const [completed, setCompleted] = useState<{ data: ConsultationData; id: number } | null>(null)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null)
  const { salvarConsulta } = useConsultas()
  const { appointments, updateAppointment } = useAppointments()

  const availableAppointments = appointments
    .filter((item) => !['completed', 'cancelled', 'no-show'].includes(item.status))
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))

  function selectAppointment(id: number | null) {
    setSelectedAppointmentId(id)
    if (id === null) return
    const appointment = appointments.find((item) => item.id === id)
    if (!appointment) return
    const dog = dogs.find((item) => item.id === appointment.dogId)
      ?? dogs.find((item) => item.name.trim().toLocaleLowerCase('pt-BR') === appointment.dogName.trim().toLocaleLowerCase('pt-BR'))
    setData((current) => ({
      ...current,
      dogName: appointment.dogName,
      tutorName: appointment.tutorName,
      veterinarian: appointment.veterinarian,
      age: dog?.age || appointment.dogAge || current.age,
      breed: dog?.breed || appointment.dogBreed || current.breed,
      mainComplaint: current.mainComplaint || appointment.serviceType,
      history: current.history || [dog?.history, appointment.notes].filter(Boolean).join('\n'),
    }))
    setMessage('Dados do agendamento carregados com sucesso.')
  }

  function update(key: keyof ConsultationData, value: string) {
    setData((current) => ({ ...current, [key]: value }))
    setMessage('')
  }

  async function saveRecord() {
    if (saveLock.current || completed) return
    if (![data.dogName, data.tutorName, data.veterinarian].every((value) => value.trim())) {
      setMessage('Preencha a identificação do paciente antes de finalizar.')
      setStep(1)
      return
    }
    saveLock.current = true
    setSaving(true)
    setMessage('')
    try {
      const resultado = await salvarConsulta(data)
      if (!resultado.sucesso || resultado.id === undefined) {
        setMessage(resultado.erro ?? 'Não foi possível salvar o atendimento. Os dados preenchidos foram mantidos.')
        return
      }
      setCompleted({ data: { ...data }, id: resultado.id })
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
    setData(EMPTY_CONSULTATION)
    setSelectedAppointmentId(null)
    setStep(1)
    setMessage('')
  }

  if (completed) return <section className="consultation-panel content-card">
    <h2>Atendimento finalizado</h2>
    <p>Atendimento nº {completed.id} de <strong>{completed.data.dogName}</strong> salvo no prontuário.</p>
    <p>Para emitir uma receita, acesse a aba Receituário.</p>
    <div className="form-actions">
      <button className="secondary-button" onClick={() => setMessage(generateConsultationReport(completed.data) ? 'Relatório clínico aberto.' : 'O navegador bloqueou o relatório. Permita novas janelas e tente novamente.')}>Gerar relatório clínico</button>
      <button className="secondary-button" disabled={saving} onClick={startNew}>Novo atendimento</button>
    </div>
    {message && <p className="consultation-message" role="status">{message}</p>}
  </section>
  return (
    <section className="clinical-care-module">
      <fieldset className="consultation-edit-fields" disabled={saving}>
      <ConsultationHeader currentStep={step} onStepChange={setStep} />
      {step === 1 && <IdentificationStep data={data} appointments={availableAppointments} selectedAppointmentId={selectedAppointmentId} onSelectAppointment={selectAppointment} update={update} onNext={() => setStep(2)} />}
      {step === 2 && <ClinicalHistoryStep data={data} update={update} onBack={() => setStep(1)} onNext={() => setStep(3)} />}
      {step === 3 && <PhysicalExamStep data={data} update={update} onBack={() => setStep(2)} onNext={() => setStep(4)} />}
      {step === 4 && <DiagnosisStep data={data} update={update} onBack={() => setStep(3)} />}
      </fieldset>
      {message && <p className="consultation-message" role="status">{message}</p>}
      <div className="consultation-actions">
        <button className="record-button" disabled={saving} onClick={saveRecord}>{saving ? 'Salvando atendimento...' : 'Finalizar atendimento e salvar no prontuário'}</button>

      </div>
    </section>
  )
}
