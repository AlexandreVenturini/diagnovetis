import { describe, expect, it } from 'vitest'
import { dateInput, filterPrescriptionHistory, periodBounds, shiftPeriod, type HistoryFilters } from '../features/prescriptions/historyFilters'
import { EMPTY_CONSULTATION } from '../features/consultations/consultationTypes'
import { emptyPrescription, emptyPrescriptionItem } from '../features/consultations/prescriptionReport'
import type { IssuedPrescription } from '../services/PrescriptionService'

const filters: HistoryFilters = { view: 'week', date: '2026-09-21', query: '', veterinarian: '', medication: '' }
const row = (date: string, name: string, vet: string, medication: string): IssuedPrescription => ({ id: name, petId: 1, snapshot: { version: 1, issuedAt: new Date(`${date}T12:00:00`).toISOString(), patient: { ...EMPTY_CONSULTATION, dogName: name, tutorName: 'Maria', veterinarian: vet }, prescription: { ...emptyPrescription(), items: [{ ...emptyPrescriptionItem(), medication }] } } })

describe('Filtros do histórico de receitas', () => {
  it('considera a semana de segunda a domingo, inclusive nas mudanças de ano', () => {
    expect(periodBounds('2026-09-27', 'week')).toEqual({ start: '2026-09-21', end: '2026-09-27' })
    expect(periodBounds('2027-01-01', 'week')).toEqual({ start: '2026-12-28', end: '2027-01-03' })
  })
  it('navega entre dias, semanas e meses sem pular fevereiro', () => {
    expect(shiftPeriod('2026-01-31', 'month', 1)).toBe('2026-02-01')
    expect(periodBounds('2028-02-10', 'month').end).toBe('2028-02-29')
    expect(shiftPeriod('2026-09-21', 'week', -1)).toBe('2026-09-14')
    expect(shiftPeriod('2026-12-31', 'day', 1)).toBe('2027-01-01')
  })
  it('combina busca, veterinário, medicamento e período', () => {
    const history = [row('2026-09-21', 'Rex', 'Ana', 'A'), row('2026-09-27', 'Bia', 'João', 'B'), row('2026-09-28', 'Tobi', 'Ana', 'A')]
    expect(filterPrescriptionHistory(history, filters).map(item => item.id)).toEqual(['Rex', 'Bia'])
    expect(filterPrescriptionHistory(history, { ...filters, query: ' MARIA ', veterinarian: 'Ana', medication: 'A' }).map(item => item.id)).toEqual(['Rex'])
    expect(filterPrescriptionHistory(history, { ...filters, veterinarian: 'Ana', medication: 'B' })).toEqual([])
    expect(filterPrescriptionHistory(history, { ...filters, view: 'day' }).length).toBe(1)
    expect(filterPrescriptionHistory(history, { ...filters, view: 'month' }).length).toBe(3)
  })
  it('filtra pela data local da emissão', () => {
    const prescription = row('2026-09-21', 'Rex', 'Ana', 'A')
    prescription.snapshot.issuedAt = '2026-09-22T01:00:00Z'
    expect(filterPrescriptionHistory([prescription], { ...filters, view: 'day', date: dateInput(new Date(prescription.snapshot.issuedAt)) })).toHaveLength(1)
  })
})
