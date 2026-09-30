import { inRange, type DateRange, type PeriodView } from '../../common/period'
import type { Appointment, AppointmentStatus } from '../appointmentTypes'

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  confirmed: 'Confirmado',
  waiting: 'Aguardando',
  'in-progress': 'Em atendimento',
  completed: 'Concluído',
  'no-show': 'Faltou',
  cancelled: 'Cancelado',
}

export type AgendaFilters = {
  query: string
  veterinarian: string
  service: string
  status: AppointmentStatus | 'all'
}

export function formatAgendaDate(date: string) {
  if (!date) return 'Data não informada'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(`${date}T12:00:00`),
  )
}

export function toDateInput(date: Date) {
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

export const uniqueValues = (values: string[]) => [...new Set(values.filter(Boolean))]

export function filterAppointments(appointments: Appointment[], filters: AgendaFilters) {
  const query = filters.query.trim().toLocaleLowerCase('pt-BR')
  return appointments.filter(
    (appointment) =>
      (!query || `${appointment.dogName} ${appointment.tutorName}`.toLocaleLowerCase('pt-BR').includes(query)) &&
      (filters.veterinarian === 'all' || appointment.veterinarian === filters.veterinarian) &&
      (filters.service === 'all' || appointment.serviceType === filters.service) &&
      (filters.status === 'all' || appointment.status === filters.status),
  )
}

export function appointmentsInPeriod(appointments: Appointment[], range: DateRange | null, view: PeriodView) {
  return appointments
    .filter((appointment) => (appointment.date ? inRange(appointment.date, range) : view === 'day' || !range))
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
}

export function pendingReminders(appointments: Appointment[]) {
  return appointments
    .flatMap((appointment) =>
      appointment.reminders.filter((reminder) => !reminder.done).map((reminder) => ({ appointment, reminder })),
    )
    .sort((a, b) => a.reminder.date.localeCompare(b.reminder.date))
}

export function hasLocalConflict(appointments: Appointment[], target: Appointment, date: string, time: string) {
  return appointments.some(
    (item) =>
      item.id !== target.id &&
      item.status !== 'cancelled' &&
      item.veterinarian === target.veterinarian &&
      item.date === date &&
      item.time === time,
  )
}
