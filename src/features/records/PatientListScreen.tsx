import { Icon } from '../../components/common/Icon'
import type { UserRole } from '../auth/profile'
import { PeriodFilter } from '../common/PeriodFilter'
import { periodNoun, type PeriodValue } from '../common/period'
import { PatientList } from './PatientList'
import type { PatientSummary } from './PatientList'

type PatientListScreenProps = {
  role: UserRole
  patients: PatientSummary[]
  loading: boolean
  error: string
  period: PeriodValue
  onPeriodChange: (period: PeriodValue) => void
  query: string
  onQueryChange: (query: string) => void
  onSelect: (patient: PatientSummary) => void
}

export function PatientListScreen({
  role,
  patients,
  loading,
  error,
  period,
  onPeriodChange,
  query,
  onQueryChange,
  onSelect,
}: PatientListScreenProps) {
  const searching = Boolean(query.trim())
  return (
    <section className="records-module">
      <div className="records-heading">
        <div>
          <h2>Prontuários Clínicos</h2>
          <p>
            {role === 'attendant'
              ? 'Consulte o histórico completo dos pacientes. Correções em atendimentos precisam da autorização de um professor.'
              : 'Consulte o histórico completo dos pacientes.'}
          </p>
        </div>
        <div className="records-stat">
          <strong>{patients.length}</strong>
          <span>{searching ? 'pacientes encontrados' : `pacientes atendidos ${periodNoun(period.view)}`}</span>
        </div>
      </div>

      <PeriodFilter label="Período dos atendimentos" value={period} onChange={onPeriodChange} searching={searching}>
        <label className="agenda-search">
          <span>Buscar paciente</span>
          <span className="record-search record-search--inline">
            <Icon>
              <circle cx="11" cy="11" r="7" />
              <path d="m16 16 5 5" />
            </Icon>
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Nome do animal ou tutor"
            />
          </span>
        </label>
      </PeriodFilter>

      {error && <div className="empty-appointments">{error}</div>}
      {loading ? (
        <div className="empty-appointments">Carregando prontuários...</div>
      ) : (
        <PatientList
          patients={patients}
          emptyText={
            searching ? 'Nenhum paciente encontrado com esse nome.' : 'Nenhum paciente atendido neste período.'
          }
          onSelect={onSelect}
        />
      )}
    </section>
  )
}
