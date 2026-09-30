import type { ConsultationData } from '../../consultations/consultationTypes'
import { prescriptionHtml, type Prescription } from '../prescriptionReport'

type PrescriptionReviewProps = {
  patient: ConsultationData
  prescription: Prescription
  isStudent: boolean
  saving: boolean
  pendingEmission: boolean
  onEdit: () => void
  onConfirm: () => void
}

function confirmLabel(saving: boolean, isStudent: boolean, pendingEmission: boolean) {
  if (saving) return 'Emitindo…'
  if (isStudent) return 'Enviar para aprovação'
  return pendingEmission ? 'Tentar emissão novamente' : 'Emitir e salvar no prontuário'
}

export function PrescriptionReview({
  patient,
  prescription,
  isStudent,
  saving,
  pendingEmission,
  onEdit,
  onConfirm,
}: PrescriptionReviewProps) {
  return (
    <section className="content-card rx-details">
      <h3>{isStudent ? 'Revise a receita antes de enviar' : 'Revise a receita antes de emitir'}</h3>
      <iframe
        title="Visualização da nova receita"
        className="rx-preview"
        sandbox=""
        srcDoc={prescriptionHtml(patient, prescription)}
      />
      <p>
        {isStudent
          ? 'A receita só é emitida depois da aprovação de um médico-veterinário, que assina com o próprio nome e CRMV.'
          : 'Confira os dados e as doses. A emissão salva uma cópia no prontuário.'}
      </p>
      <div className="form-actions">
        <button className="secondary-button" disabled={saving || pendingEmission} onClick={onEdit}>
          Voltar e editar
        </button>
        <button className="primary-button" disabled={saving} onClick={onConfirm}>
          {confirmLabel(saving, isStudent, pendingEmission)}
        </button>
      </div>
      {pendingEmission && !saving && (
        <p>A emissão ainda não foi confirmada. Tente novamente para verificar e concluir a mesma receita.</p>
      )}
    </section>
  )
}
