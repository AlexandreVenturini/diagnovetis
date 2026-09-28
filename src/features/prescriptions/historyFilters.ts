import type { IssuedPrescription } from '../../services/PrescriptionService'
import { dateInput, inRange, periodBounds, periodLabel, periodRange, shiftPeriod, type PeriodView } from '../common/period'

export type HistoryView = PeriodView
export type HistoryFilters = { view: HistoryView; date: string; query: string; veterinarian: string; medication: string }
export { dateInput, periodBounds, periodLabel, shiftPeriod }

export function filterPrescriptionHistory(history: IssuedPrescription[], filters: HistoryFilters) {
  const query = filters.query.trim().toLocaleLowerCase('pt-BR')
  const range = query ? null : periodRange({ view: filters.view, date: filters.date })
  return history.filter(row => {
    const { patient, prescription, issuedAt } = row.snapshot
    const issuedDate = dateInput(new Date(issuedAt))
    const medications = prescription.items.map(item => item.medication)
    const searchable = `${patient.dogName} ${patient.tutorName} ${patient.veterinarian} ${prescription.crmv} ${medications.join(' ')}`.toLocaleLowerCase('pt-BR')
    return inRange(issuedDate, range) && searchable.includes(query)
      && (!filters.veterinarian || patient.veterinarian === filters.veterinarian)
      && (!filters.medication || medications.includes(filters.medication))
  })
}
