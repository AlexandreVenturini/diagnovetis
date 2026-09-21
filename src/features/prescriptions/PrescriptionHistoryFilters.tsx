import type { IssuedPrescription } from '../../services/PrescriptionService'
import { dateInput, periodLabel, shiftPeriod, type HistoryFilters, type HistoryView } from './historyFilters'

export function PrescriptionHistoryFilters({ history, value, onChange }: { history: IssuedPrescription[]; value: HistoryFilters; onChange: (value: HistoryFilters) => void }) {
  const veterinarians = [...new Set(history.map(row => row.snapshot.patient.veterinarian).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  const medications = [...new Set(history.flatMap(row => row.snapshot.prescription.items.map(item => item.medication)).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  return <div className="agenda-toolbar content-card">
    <div className="view-switch" aria-label="Período do histórico de receitas">
      {(['day', 'week', 'month'] as HistoryView[]).map(view => <button type="button" key={view} className={value.view === view ? 'active' : ''} aria-pressed={value.view === view} onClick={() => onChange({ ...value, view })}>{view === 'day' ? 'Dia' : view === 'week' ? 'Semana' : 'Mês'}</button>)}
    </div>
    <div className="period-navigation">
      <button type="button" aria-label="Período anterior" onClick={() => onChange({ ...value, date: shiftPeriod(value.date, value.view, -1) })}>‹</button>
      <strong aria-live="polite">{periodLabel(value.date, value.view)}</strong>
      <button type="button" aria-label="Próximo período" onClick={() => onChange({ ...value, date: shiftPeriod(value.date, value.view, 1) })}>›</button>
      <button type="button" className="today-button" onClick={() => onChange({ ...value, date: dateInput() })}>Hoje</button>
    </div>
    <div className="agenda-filters">
      <label>Buscar receitas<input value={value.query} onChange={event => onChange({ ...value, query: event.target.value })} placeholder="Animal, tutor, veterinário ou medicamento" /></label>
      <label>Veterinário<select value={value.veterinarian} onChange={event => onChange({ ...value, veterinarian: event.target.value })}><option value="">Todos</option>{veterinarians.map(name => <option key={name} value={name}>{name}</option>)}</select></label>
      <label>Medicamento<select value={value.medication} onChange={event => onChange({ ...value, medication: event.target.value })}><option value="">Todos</option>{medications.map(name => <option key={name} value={name}>{name}</option>)}</select></label>
      <label>Ir para data<input type="date" value={value.date} onChange={event => { if (event.target.value) onChange({ ...value, date: event.target.value }) }} /></label>
    </div>
  </div>
}
