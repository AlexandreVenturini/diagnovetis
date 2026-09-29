import { useMemo, useState } from 'react'
import { Icon } from '../../components/common/Icon'
import { PeriodFilter } from '../common/PeriodFilter'
import { inRange, periodNoun, periodRange, type PeriodValue } from '../common/period'
import type { Appointment, AppointmentReminder, AppointmentStatus, ReminderType } from './appointmentTypes'

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

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  confirmed: 'Confirmado',
  waiting: 'Aguardando',
  'in-progress': 'Em atendimento',
  completed: 'Concluído',
  'no-show': 'Faltou',
  cancelled: 'Cancelado',
}

function parseDate(date: string) {
  return new Date(`${date}T12:00:00`)
}

function toDateInput(date: Date) {
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

function formatDate(date: string, options?: Intl.DateTimeFormatOptions) {
  if (!date) return 'Data não informada'
  return new Intl.DateTimeFormat('pt-BR', options ?? { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    parseDate(date),
  )
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
  const [rescheduling, setRescheduling] = useState<Appointment | null>(null)
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')
  const [cancelling, setCancelling] = useState<Appointment | null>(null)
  const [cancellationReason, setCancellationReason] = useState('')
  const [reminderFor, setReminderFor] = useState<Appointment | null>(null)
  const [reminderType, setReminderType] = useState<ReminderType>('return')
  const [reminderDate, setReminderDate] = useState('')
  const [dialogError, setDialogError] = useState('')

  const veterinarians = [...new Set(appointments.map((item) => item.veterinarian).filter(Boolean))]
  const services = [...new Set(appointments.map((item) => item.serviceType).filter(Boolean))]

  const filtered = useMemo(
    () =>
      appointments.filter((appointment) => {
        const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR')
        const matchesQuery =
          !normalizedQuery ||
          `${appointment.dogName} ${appointment.tutorName}`.toLocaleLowerCase('pt-BR').includes(normalizedQuery)
        return (
          matchesQuery &&
          (veterinarian === 'all' || appointment.veterinarian === veterinarian) &&
          (service === 'all' || appointment.serviceType === service) &&
          (status === 'all' || appointment.status === status)
        )
      }),
    [appointments, query, veterinarian, service, status],
  )

  const visibleAppointments = filtered
    .filter((appointment) => {
      if (!appointment.date) return period.view === 'day' || !range
      return inRange(appointment.date, range)
    })
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
  const pendingReminders = (reminderAppointments ?? appointments)
    .flatMap((appointment) =>
      appointment.reminders.filter((reminder) => !reminder.done).map((reminder) => ({ appointment, reminder })),
    )
    .sort((a, b) => a.reminder.date.localeCompare(b.reminder.date))

  function openReschedule(appointment: Appointment) {
    setRescheduling(appointment)
    setNewDate(appointment.date)
    setNewTime(appointment.time)
    setDialogError('')
  }

  async function confirmReschedule() {
    if (!rescheduling || !newDate || !newTime) return
    const conflict =
      appointments.some(
        (item) =>
          item.id !== rescheduling.id &&
          item.status !== 'cancelled' &&
          item.veterinarian === rescheduling.veterinarian &&
          item.date === newDate &&
          item.time === newTime,
      ) || Boolean(await onCheckConflict?.(rescheduling.veterinarian, newDate, newTime, rescheduling.id))
    if (conflict) {
      setDialogError('Este veterinário já possui uma consulta nesse horário.')
      return
    }
    onUpdate(rescheduling.id, { date: newDate, time: newTime, status: 'confirmed' })
    if (period.view !== 'all') setPeriod({ ...period, date: newDate })
    setRescheduling(null)
  }

  function confirmCancellation() {
    if (!cancelling || !cancellationReason.trim()) {
      setDialogError('Informe o motivo do cancelamento.')
      return
    }
    onUpdate(cancelling.id, { status: 'cancelled', cancellationReason: cancellationReason.trim() })
    setCancelling(null)
    setCancellationReason('')
    setDialogError('')
  }

  function addReminder() {
    if (!reminderFor || !reminderDate) {
      setDialogError('Informe a data do lembrete.')
      return
    }
    const reminder: AppointmentReminder = { id: Date.now(), type: reminderType, date: reminderDate, done: false }
    onUpdate(reminderFor.id, { reminders: [...reminderFor.reminders, reminder] })
    setReminderFor(null)
    setReminderDate('')
    setDialogError('')
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
              const isExpanded = expandedId === appointment.id
              return (
                <article
                  className={`appointment-card status-${appointment.status}${isExpanded ? ' expanded' : ''}`}
                  key={appointment.id}
                >
                  <button
                    className="appointment-card-summary"
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() => setExpandedId(isExpanded ? null : appointment.id)}
                  >
                    <div>
                      <div className="appointment-name-row">
                        <strong>{appointment.dogName}</strong>
                        <span className={`status-badge status-${appointment.status}`}>
                          {STATUS_LABELS[appointment.status]}
                        </span>
                      </div>
                      <p>Tutor: {appointment.tutorName}</p>
                      <div className="appointment-meta">
                        <span>▣ {formatDate(appointment.date)}</span>
                        <span>◷ {appointment.time || 'Horário não informado'}</span>
                      </div>
                    </div>
                    <div className="appointment-card-side">
                      <span className="service-label">{appointment.serviceType}</span>
                      <span className="appointment-chevron">
                        <Icon>
                          <path d="m7 10 5 5 5-5" />
                        </Icon>
                      </span>
                    </div>
                  </button>
                  {onStartCare && !['completed', 'cancelled', 'no-show'].includes(appointment.status) && (
                    <div className="appointment-care-action">
                      <button type="button" className="primary-button" onClick={() => onStartCare(appointment)}>
                        Ir para atendimento
                      </button>
                    </div>
                  )}
                  {isExpanded && (
                    <div className="appointment-details">
                      <div>
                        <span>Veterinário</span>
                        <strong>{appointment.veterinarian || 'Não informado'}</strong>
                      </div>
                      <div>
                        <span>Tipo</span>
                        <strong>Horário marcado</strong>
                      </div>
                      <div>
                        <span>Observações</span>
                        <strong>{appointment.notes || 'Nenhuma observação'}</strong>
                      </div>
                      {appointment.cancellationReason && (
                        <div className="appointment-notes">
                          <span>Motivo do cancelamento</span>
                          <strong>{appointment.cancellationReason}</strong>
                        </div>
                      )}
                      <div className="appointment-actions appointment-notes">
                        <select
                          aria-label="Alterar situação"
                          value={appointment.status}
                          onChange={(event) =>
                            onUpdate(appointment.id, { status: event.target.value as AppointmentStatus })
                          }
                        >
                          {Object.entries(STATUS_LABELS)
                            .filter(([value]) => value !== 'cancelled')
                            .map(([value, label]) => (
                              <option value={value} key={value}>
                                {label}
                              </option>
                            ))}
                          {appointment.status === 'cancelled' && <option value="cancelled">Cancelado</option>}
                        </select>
                        <button onClick={() => openReschedule(appointment)}>Remarcar</button>
                        <button
                          onClick={() => {
                            setReminderFor(appointment)
                            setDialogError('')
                          }}
                        >
                          Criar lembrete
                        </button>
                        <button
                          className="danger-action"
                          disabled={appointment.status === 'cancelled'}
                          onClick={() => {
                            setCancelling(appointment)
                            setDialogError('')
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        </div>

        <aside className="reminders-column">
          <h3>Lembretes</h3>
          <div className="reminders-panel">
            {pendingReminders.length === 0 && <p className="empty-reminders">Nenhum lembrete pendente.</p>}
            {pendingReminders.slice(0, 6).map(({ appointment, reminder }) => (
              <div className="reminder-item" key={reminder.id}>
                <span className={`reminder-icon ${reminder.type}`}>{reminder.type === 'return' ? '↻' : '+'}</span>
                <div>
                  <strong>
                    {reminder.type === 'return' ? 'Retorno' : 'Vacinação'} — {appointment.dogName}
                  </strong>
                  <span>
                    {formatDate(reminder.date)} · {appointment.tutorName}
                  </span>
                </div>
                <button
                  aria-label="Marcar lembrete como concluído"
                  onClick={() =>
                    onUpdate(appointment.id, {
                      reminders: appointment.reminders.map((item) =>
                        item.id === reminder.id ? { ...item, done: true } : item,
                      ),
                    })
                  }
                >
                  ✓
                </button>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {(rescheduling || cancelling || reminderFor) && (
        <div className="agenda-modal-backdrop" role="presentation">
          <section className="agenda-modal" role="dialog" aria-modal="true" aria-labelledby="agenda-dialog-title">
            {rescheduling && (
              <>
                <h3 id="agenda-dialog-title">Remarcar consulta de {rescheduling.dogName}</h3>
                <div className="modal-fields">
                  <label>
                    Nova data
                    <input type="date" value={newDate} onChange={(event) => setNewDate(event.target.value)} />
                  </label>
                  <label>
                    Novo horário
                    <input type="time" value={newTime} onChange={(event) => setNewTime(event.target.value)} />
                  </label>
                </div>
                {dialogError && <p className="dialog-error">{dialogError}</p>}
                <div className="modal-actions">
                  <button className="secondary-button" onClick={() => setRescheduling(null)}>
                    Voltar
                  </button>
                  <button className="primary-button" onClick={confirmReschedule}>
                    Confirmar remarcação
                  </button>
                </div>
              </>
            )}
            {cancelling && (
              <>
                <h3 id="agenda-dialog-title">Cancelar consulta de {cancelling.dogName}</h3>
                <label className="cancel-reason">
                  Motivo do cancelamento
                  <textarea
                    value={cancellationReason}
                    onChange={(event) => setCancellationReason(event.target.value)}
                    placeholder="Descreva o motivo"
                  />
                </label>
                {dialogError && <p className="dialog-error">{dialogError}</p>}
                <div className="modal-actions">
                  <button className="secondary-button" onClick={() => setCancelling(null)}>
                    Voltar
                  </button>
                  <button className="danger-button" onClick={confirmCancellation}>
                    Cancelar consulta
                  </button>
                </div>
              </>
            )}
            {reminderFor && (
              <>
                <h3 id="agenda-dialog-title">Novo lembrete para {reminderFor.dogName}</h3>
                <div className="modal-fields">
                  <label>
                    Tipo
                    <select
                      value={reminderType}
                      onChange={(event) => setReminderType(event.target.value as ReminderType)}
                    >
                      <option value="return">Retorno</option>
                      <option value="vaccination">Vacinação</option>
                    </select>
                  </label>
                  <label>
                    Data
                    <input type="date" value={reminderDate} onChange={(event) => setReminderDate(event.target.value)} />
                  </label>
                </div>
                {dialogError && <p className="dialog-error">{dialogError}</p>}
                <div className="modal-actions">
                  <button className="secondary-button" onClick={() => setReminderFor(null)}>
                    Voltar
                  </button>
                  <button className="primary-button" onClick={addReminder}>
                    Salvar lembrete
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </section>
  )
}
