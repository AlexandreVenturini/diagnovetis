import type { Appointment, AppointmentReminder } from '../appointmentTypes'
import { formatAgendaDate } from './agendaFilters'

type RemindersPanelProps = {
  reminders: { appointment: Appointment; reminder: AppointmentReminder }[]
  onDone: (appointment: Appointment, reminderId: number) => void
}

export function RemindersPanel({ reminders, onDone }: RemindersPanelProps) {
  return (
    <aside className="reminders-column">
      <h3>Lembretes</h3>
      <div className="reminders-panel">
        {reminders.length === 0 && <p className="empty-reminders">Nenhum lembrete pendente.</p>}
        {reminders.slice(0, 6).map(({ appointment, reminder }) => (
          <div className="reminder-item" key={reminder.id}>
            <span className={`reminder-icon ${reminder.type}`}>{reminder.type === 'return' ? '↻' : '+'}</span>
            <div>
              <strong>
                {reminder.type === 'return' ? 'Retorno' : 'Vacinação'} — {appointment.dogName}
              </strong>
              <span>
                {formatAgendaDate(reminder.date)} · {appointment.tutorName}
              </span>
            </div>
            <button aria-label="Marcar lembrete como concluído" onClick={() => onDone(appointment, reminder.id)}>
              ✓
            </button>
          </div>
        ))}
      </div>
    </aside>
  )
}
