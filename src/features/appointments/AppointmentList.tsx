import { useMemo, useState } from 'react'
import { Icon } from '../../components/common/Icon'
import { PeriodFilter } from '../common/PeriodFilter'
import { periodNoun, periodRange, type PeriodValue } from '../common/period'
import type { Appointment, AppointmentStatus } from './appointmentTypes'
import { AgendaDialogs, type AgendaDialog } from './agenda/AgendaDialogs'
import { AppointmentCard } from './agenda/AppointmentCard'
import { RemindersPanel } from './agenda/RemindersPanel'
import {
  STATUS_LABELS,
  appointmentsInPeriod,
  filterAppointments,
  hasLocalConflict,
  pendingReminders,
  toDateInput,
  uniqueValues,
} from './agenda/agendaFilters'

type AppointmentListProps = {
  appointments: Appointment[]
  onStartCare?: (appointment: Appointment) => void
  onCreate: () => void
  onUpdate: (id: number, changes: Partial<Appointment>) => void
  period?: PeriodValue
  onPeriodChange?: (value: PeriodValue) => void
  query?: string
  onQueryChange?: (value: string) => void
  reminderAppointments?: Appointment[]
  onCheckConflict?: (veterinarian: string, date: string, time: string, ignoreId: number) => Promise<boolean>
  loading?: boolean
}

export function AppointmentList({
  appointments,
  onCreate,
  onUpdate,
  onStartCare,
  period: controlledPeriod,
  onPeriodChange,
  query: controlledQuery,
  onQueryChange,
  reminderAppointments,
  onCheckConflict,
  loading = false,
}: AppointmentListProps) {
  const initialDate = appointments.find((item) => item.date)?.date ?? toDateInput(new Date())
  const [localPeriod, setLocalPeriod] = useState<PeriodValue>({ view: 'week', date: initialDate })
  const [localQuery, setLocalQuery] = useState('')
  const period = controlledPeriod ?? localPeriod
  const setPeriod = onPeriodChange ?? setLocalPeriod
  const query = controlledQuery ?? localQuery
  const setQuery = onQueryChange ?? setLocalQuery
  const searching = Boolean(query.trim())
  const range = searching ? null : periodRange(period)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [veterinarian, setVeterinarian] = useState('all')
  const [service, setService] = useState('all')
  const [status, setStatus] = useState<AppointmentStatus | 'all'>('all')
  const [dialog, setDialog] = useState<AgendaDialog | null>(null)

  const veterinarians = uniqueValues(appointments.map((item) => item.veterinarian))
  const services = uniqueValues(appointments.map((item) => item.serviceType))
  const filtered = useMemo(
    () => filterAppointments(appointments, { query, veterinarian, service, status }),
    [appointments, query, veterinarian, service, status],
  )
  const visibleAppointments = appointmentsInPeriod(filtered, range, period.view)
  const reminders = pendingReminders(reminderAppointments ?? appointments)

  async function hasConflict(appointment: Appointment, date: string, time: string) {
    return (
      hasLocalConflict(appointments, appointment, date, time) ||
      Boolean(await onCheckConflict?.(appointment.veterinarian, date, time, appointment.id))
    )
  }

  return (
    <section className="appointment-list">
      <div className="section-heading appointment-title-row">
        <div>
          <h2>Agenda de Consultas</h2>
          <p className="section-subtitle">Organize atendimentos, retornos e vacinações.</p>
        </div>
        <button className="primary-button new-button" onClick={onCreate}>
          <Icon>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M7 3v4m10-4v4M3 10h18" />
          </Icon>
          Novo Agendamento
        </button>
      </div>

      <PeriodFilter label="Visualização da agenda" value={period} onChange={setPeriod} searching={searching}>
        <label className="agenda-search">
          <span>Buscar</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tutor ou animal" />
        </label>
        <label>
          <span>Veterinário</span>
          <select value={veterinarian} onChange={(event) => setVeterinarian(event.target.value)}>
            <option value="all">Todos</option>
            {veterinarians.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Serviço</span>
          <select value={service} onChange={(event) => setService(event.target.value)}>
            <option value="all">Todos</option>
            {services.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Situação</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as AppointmentStatus | 'all')}>
            <option value="all">Todas</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </PeriodFilter>

      <div className="agenda-grid enhanced-agenda-grid">
        <div className="upcoming-column">
          <div className="agenda-list-heading">
            <h3>{searching ? 'Resultado da busca' : `Consultas ${periodNoun(period.view)}`}</h3>
            <span>{visibleAppointments.length} resultado(s)</span>
          </div>
          <div className="appointment-cards">
            {loading && <div className="empty-appointments">Carregando agenda...</div>}
            {!loading && visibleAppointments.length === 0 && (
              <div className="empty-appointments">Nenhuma consulta encontrada neste período.</div>
            )}
            {visibleAppointments.map((appointment) => {
              const expanded = expandedId === appointment.id
              return (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  expanded={expanded}
                  onToggle={() => setExpandedId(expanded ? null : appointment.id)}
                  onStartCare={onStartCare}
                  onStatusChange={(next) => onUpdate(appointment.id, { status: next })}
                  onOpenDialog={(kind) => setDialog({ kind, appointment })}
                />
              )
            })}
          </div>
        </div>

        <RemindersPanel
          reminders={reminders}
          onDone={(appointment, reminderId) =>
            onUpdate(appointment.id, {
              reminders: appointment.reminders.map((item) => (item.id === reminderId ? { ...item, done: true } : item)),
            })
          }
        />
      </div>

      {dialog && (
        <AgendaDialogs
          key={`${dialog.kind}-${dialog.appointment.id}`}
          dialog={dialog}
          onClose={() => setDialog(null)}
          hasConflict={hasConflict}
          onReschedule={(appointment, date, time) => {
            onUpdate(appointment.id, { date, time, status: 'confirmed' })
            if (period.view !== 'all') setPeriod({ ...period, date })
            setDialog(null)
          }}
          onCancelAppointment={(appointment, reason) => {
            onUpdate(appointment.id, { status: 'cancelled', cancellationReason: reason })
            setDialog(null)
          }}
          onAddReminder={(appointment, reminder) => {
            onUpdate(appointment.id, { reminders: [...appointment.reminders, reminder] })
            setDialog(null)
          }}
        />
      )}
    </section>
  )
}
