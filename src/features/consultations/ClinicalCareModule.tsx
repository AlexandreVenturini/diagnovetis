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

export function ClinicalCareModule() {
  const [step, setStep] = useState<ConsultationStep>(1)
  const [data, setData] = useState<ConsultationData>(EMPTY_CONSULTATION)
  const [message, setMessage] = useState('')
  const { salvarConsulta } = useConsultas()

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
      setMessage('Atendimento salvo no prontuário com sucesso!')
      setData(EMPTY_CONSULTATION)
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
      {step === 1 && <IdentificationStep data={data} update={update} onNext={() => setStep(2)} />}
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
