import { inRange, type DateRange } from '../common/period'
import type { PatientSummary } from './PatientList'

export type SummaryItem = {
  key: string
  consultaId: number | null
  date: string
  veterinarian: string
  pet: { id: number; dogName: string; tutorName: string; breed: string; weight: string }
}

export function summarizePatients(items: SummaryItem[], query: string, range: DateRange | null): PatientSummary[] {
  const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR')
  const byPet = new Map<number, PatientSummary>()
  for (const item of items) {
    if (!normalizedQuery && (item.consultaId === null || !inRange(item.date, range))) continue
    if (normalizedQuery && !`${item.pet.dogName} ${item.pet.tutorName}`.toLocaleLowerCase('pt-BR').includes(normalizedQuery)) continue
    const current = byPet.get(item.pet.id) ?? { ...item.pet, recordCount: 0, latest: null }
    if (item.consultaId !== null) {
      current.recordCount += 1
      if (!current.latest || item.date > current.latest.date) current.latest = { date: item.date, veterinarian: item.veterinarian }
    }
    byPet.set(item.pet.id, current)
  }
  return [...byPet.values()].sort((a, b) => (b.latest?.date ?? '').localeCompare(a.latest?.date ?? '') || a.dogName.localeCompare(b.dogName, 'pt-BR'))
}
