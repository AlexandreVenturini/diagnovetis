import { useCallback, useState } from 'react'
import { PrescriptionService, type IssuedPrescription } from '../../../services/PrescriptionService'
import { usePeriod } from '../../common/usePeriod'
import { useRangeData } from '../../common/useRangeData'
import { periodRange, type DateRange } from '../../common/period'
import { dateInput, filterPrescriptionHistory, type HistoryFilters } from './historyFilters'

const service = new PrescriptionService()

export function usePrescriptionHistory() {
  const [period, setPeriod] = usePeriod('receituario')
  const [extraFilters, setExtraFilters] = useState({ query: '', veterinarian: '', medication: '' })
  const filters: HistoryFilters = { ...period, ...extraFilters }
  const searching = Boolean(extraFilters.query.trim())
  const range = searching ? null : periodRange(period)
  const fetchHistory = useCallback((target: DateRange | null) => service.list(undefined, target), [])
  const data = useRangeData(fetchHistory, (row: IssuedPrescription) => row.id, range)

  function setFilters(value: HistoryFilters) {
    setPeriod({ view: value.view, date: value.date })
    setExtraFilters({ query: value.query, veterinarian: value.veterinarian, medication: value.medication })
  }

  function showIssued(row: IssuedPrescription) {
    data.upsert([row])
    setFilters({
      view: period.view,
      date: dateInput(new Date(row.snapshot.issuedAt)),
      query: '',
      veterinarian: '',
      medication: '',
    })
  }

  return {
    history: data.items,
    filtered: filterPrescriptionHistory(data.items, filters),
    filters,
    setFilters,
    searching,
    loading: data.loading,
    error: data.error,
    reset: data.reset,
    showIssued,
  }
}
