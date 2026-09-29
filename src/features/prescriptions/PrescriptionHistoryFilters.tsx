import type { IssuedPrescription } from '../../services/PrescriptionService'
import { PeriodFilter } from '../common/PeriodFilter'
import type { HistoryFilters } from './historyFilters'

export function PrescriptionHistoryFilters({
  history,
  value,
  onChange,
}: {
  history: IssuedPrescription[]
  value: HistoryFilters
  onChange: (value: HistoryFilters) => void
}) {
  const veterinarians = [...new Set(history.map((row) => row.snapshot.patient.veterinarian).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, 'pt-BR'),
  )
  const medications = [
    ...new Set(
      history.flatMap((row) => row.snapshot.prescription.items.map((item) => item.medication)).filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  return (
    <PeriodFilter
      label="Período do histórico de receitas"
      value={{ view: value.view, date: value.date }}
      onChange={(period) => onChange({ ...value, ...period })}
      searching={Boolean(value.query.trim())}
    >
      <label>
        <span>Buscar receitas</span>
        <input
          value={value.query}
          onChange={(event) => onChange({ ...value, query: event.target.value })}
          placeholder="Animal, tutor, veterinário ou medicamento"
        />
      </label>
      <label>
        <span>Veterinário</span>
        <select
          value={value.veterinarian}
          onChange={(event) => onChange({ ...value, veterinarian: event.target.value })}
        >
          <option value="">Todos</option>
          {veterinarians.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Medicamento</span>
        <select value={value.medication} onChange={(event) => onChange({ ...value, medication: event.target.value })}>
          <option value="">Todos</option>
          {medications.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>
    </PeriodFilter>
  )
}
