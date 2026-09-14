import type { ConsultationData } from '../features/consultations/consultationTypes'
import type { Prescription } from '../features/consultations/prescriptionReport'

/** Cópia dos dados no momento da finalização, preservada para reimpressão. */
export type PrescricaoSalva = {
  version: 1
  issuedAt: string
  patient: ConsultationData
  prescription: Prescription
}
