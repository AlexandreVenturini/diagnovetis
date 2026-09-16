import { Icon } from '../../components/common/Icon'
import type { ConsultationStep } from './consultationTypes'

type ConsultationHeaderProps = {
  currentStep: ConsultationStep
  onStepChange: (step: ConsultationStep) => void
}

const steps: Array<{ number: ConsultationStep; label: string }> = [
  { number: 1, label: 'Identificação' },
  { number: 2, label: 'Histórico Clínico' },
  { number: 3, label: 'Exame Físico' },
  { number: 4, label: 'Exames Complementares' },
  { number: 5, label: 'Diagnóstico e Conduta' },
]

export function ConsultationHeader({ currentStep, onStepChange }: ConsultationHeaderProps) {
  return (
    <header className="consultation-header content-card">
      <h2><Icon><path d="M6 3h8l4 4v14H6zM14 3v5h5M9 12h6m-6 4h6" /></Icon> Atendimento Clínico (Cães)</h2>
      <p>Registre o atendimento clínico completo com histórico clínico, exame físico, exames complementares e diagnóstico.</p>
      <nav className="consultation-steps" aria-label="Etapas do atendimento">
        {steps.map(({ number, label }) => (
          <button className={currentStep === number ? 'active' : ''} onClick={() => onStepChange(number)} key={number}>
            {number}. {label}
          </button>
        ))}
      </nav>
    </header>
  )
}
