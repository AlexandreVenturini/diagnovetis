import type { Medico } from '../../../models/Medico'
import type { Medicamento } from '../../../models/Medicamento'
import { PrescriptionEditor } from '../../consultations/PrescriptionEditor'
import type { Dog } from '../../dogs/dogTypes'
import { DoseCalculator } from './DoseCalculator'
import { MedicationSearch } from './MedicationSearch'
import { PatientSection } from './PatientSection'
import type { PrescriptionDraft } from './usePrescriptionDraft'

type NewPrescriptionFormProps = {
  dogs: Dog[]
  medicos: Medico[]
  medications: Medicamento[]
  draft: PrescriptionDraft
  isStudent: boolean
  onReview: () => void
}

export function NewPrescriptionForm({
  dogs,
  medicos,
  medications,
  draft,
  isStudent,
  onReview,
}: NewPrescriptionFormProps) {
  return (
    <>
      <PatientSection dogs={dogs} medicos={medicos} draft={draft} isStudent={isStudent} />
      <MedicationSearch medications={medications} draft={draft} />
      <DoseCalculator draft={draft} />
      <PrescriptionEditor hideCrmv={isStudent} value={draft.prescription} onChange={draft.changePrescription} />
      <div className="form-actions">
        <button className="primary-button" onClick={onReview}>
          Visualizar receita
        </button>
      </div>
    </>
  )
}
