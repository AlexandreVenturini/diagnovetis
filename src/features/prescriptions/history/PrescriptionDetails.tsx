import type { IssuedPrescription } from '../../../services/PrescriptionService'
import { prescriptionHtml } from '../prescriptionReport'

type PrescriptionDetailsProps = {
  row: IssuedPrescription
  onBack: () => void
  onPrint: () => void
  onOpenRecord: () => void
  onNew: () => void
}

export function PrescriptionDetails({ row, onBack, onPrint, onOpenRecord, onNew }: PrescriptionDetailsProps) {
  const { patient, prescription, issuedAt } = row.snapshot
  return (
    <section className="content-card rx-details">
      <button className="text-back-button" onClick={onBack}>
        ‹ Voltar ao histórico
      </button>
      <h3>Receita de {patient.dogName}</h3>
      <p>
        {new Date(issuedAt).toLocaleString('pt-BR')} · {patient.veterinarian}
      </p>
      <iframe
        className="rx-preview"
        title="Detalhes da receita emitida"
        sandbox=""
        srcDoc={prescriptionHtml(patient, prescription, new Date(issuedAt))}
      />
      <div className="form-actions">
        <button className="primary-button" onClick={onPrint}>
          PDF / Impressão
        </button>
        <button className="secondary-button" onClick={onOpenRecord}>
          Abrir prontuário
        </button>
        <button className="secondary-button" onClick={onNew}>
          Nova receita
        </button>
      </div>
    </section>
  )
}
