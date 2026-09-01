import { useState } from 'react'
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
    if (!data.dogName || !data.tutorName || !data.veterinarian) {
      setMessage('Preencha a identificação do paciente antes de salvar.')
      setStep(1)
      return
    }

    const resultado = await salvarConsulta(data)
    if (resultado.sucesso) {
      if (selectedAppointmentId !== null) updateAppointment(selectedAppointmentId, { status: 'completed' })
      setMessage('Atendimento salvo no prontuário com sucesso!')
      setData(EMPTY_CONSULTATION)
      setSelectedAppointmentId(null)
      setStep(1)
    } else {
      setMessage(resultado.erro ?? 'Erro ao salvar o atendimento.')
    }
  }

  function finish() {
    if (!data.dogName || !data.tutorName || !data.veterinarian) {
      setMessage('Preencha a identificação do paciente antes de gerar o relatório.')
      setStep(1)
      return
    }

    const reportOpened = generateConsultationReport(data)
    setMessage(reportOpened
      ? 'Relatório clínico gerado em uma nova janela.'
      : 'Não foi possível abrir o relatório. Verifique se o navegador bloqueou a nova janela.')
  }

  return (
    <section className="clinical-care-module">
      <ConsultationHeader currentStep={step} onStepChange={setStep} />
      {step === 1 && <IdentificationStep data={data} appointments={availableAppointments} selectedAppointmentId={selectedAppointmentId} onSelectAppointment={selectAppointment} update={update} onNext={() => setStep(2)} />}
      {step === 2 && <ClinicalHistoryStep data={data} update={update} onBack={() => setStep(1)} onNext={() => setStep(3)} />}
      {step === 3 && <PhysicalExamStep data={data} update={update} onBack={() => setStep(2)} onNext={() => setStep(4)} />}
      {step === 4 && <DiagnosisStep data={data} update={update} onBack={() => setStep(3)} />}
      {message && <p className="consultation-message" role="status">{message}</p>}
      <div className="consultation-actions">
        <button className="record-button" onClick={saveRecord}>▣ &nbsp; Salvar no Prontuário</button>
        <button className="finish-button" onClick={finish}>⇩ &nbsp; Finalizar e Gerar PDF</button>
      </div>
    </section>
  )
}
