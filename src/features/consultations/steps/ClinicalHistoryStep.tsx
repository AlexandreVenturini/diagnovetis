import type { ConsultationData } from '../consultationTypes'

type ClinicalHistoryStepProps = {
  data: ConsultationData
  update: (key: keyof ConsultationData, value: string) => void
  onBack: () => void
  onNext: () => void
}

export function ClinicalHistoryStep({ data, update, onBack, onNext }: ClinicalHistoryStepProps) {
  return (
    <section className="consultation-panel content-card">
      <h2>2. Histórico Clínico</h2>
      <div className="consultation-textareas">
        <label>
          Queixa Principal *
          <textarea
            value={data.mainComplaint}
            onChange={(event) => update('mainComplaint', event.target.value)}
            placeholder="Descreva a queixa principal que motivou a consulta..."
          />
        </label>
        <label>
          Histórico do Animal
          <textarea
            value={data.history}
            onChange={(event) => update('history', event.target.value)}
            placeholder="Histórico de vacinação, vermifugação, alimentação, convivência com outros animais, viagens recentes, etc."
          />
        </label>
      </div>
      <div className="step-navigation">
        <button className="secondary-button" onClick={onBack}>
          ← Voltar
        </button>
        <button className="primary-button" disabled={!data.mainComplaint} onClick={onNext}>
          Próximo: Exame Físico →
        </button>
      </div>
    </section>
  )
}
