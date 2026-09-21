import type { IssuedPrescription } from '../../services/PrescriptionService'

export type HistoryView = 'day' | 'week' | 'month'
export type HistoryFilters = { view: HistoryView; date: string; query: string; veterinarian: string; medication: string }
export const dateInput = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const parse = (date: string) => new Date(`${date}T12:00:00`)

export function periodBounds(date: string, view: HistoryView) {
  const start = parse(date)
  if (view === 'week') start.setDate(start.getDate() - (start.getDay() + 6) % 7)
  if (view === 'month') start.setDate(1)
  const end = new Date(start)
  if (view === 'week') end.setDate(end.getDate() + 6)
  if (view === 'month') end.setMonth(end.getMonth() + 1, 0)
  return { start: dateInput(start), end: dateInput(end) }
}

export function shiftPeriod(date: string, view: HistoryView, amount: number) {
  const next = parse(date)
  if (view === 'month') next.setMonth(next.getMonth() + amount, 1)
  else next.setDate(next.getDate() + amount * (view === 'week' ? 7 : 1))
  return dateInput(next)
}

export function periodLabel(date: string, view: HistoryView) {
  const format = (value: string, options: Intl.DateTimeFormatOptions) => parse(value).toLocaleDateString('pt-BR', options)
  if (view === 'day') return format(date, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
  if (view === 'month') return format(date, { month: 'long', year: 'numeric' })
  const { start, end } = periodBounds(date, view)
  return `${format(start, { day: '2-digit', month: 'short' })} — ${format(end, { day: '2-digit', month: 'short', year: 'numeric' })}`
}

export function filterPrescriptionHistory(history: IssuedPrescription[], filters: HistoryFilters) {
  const { start, end } = periodBounds(filters.date, filters.view)
  const query = filters.query.trim().toLocaleLowerCase('pt-BR')
  return history.filter(row => {
    const { patient, prescription, issuedAt } = row.snapshot
    const issuedDate = dateInput(new Date(issuedAt))
    const medications = prescription.items.map(item => item.medication)
    const searchable = `${patient.dogName} ${patient.tutorName} ${patient.veterinarian} ${prescription.crmv} ${medications.join(' ')}`.toLocaleLowerCase('pt-BR')
    return issuedDate >= start && issuedDate <= end && searchable.includes(query)
      && (!filters.veterinarian || patient.veterinarian === filters.veterinarian)
      && (!filters.medication || medications.includes(filters.medication))
  })
}
