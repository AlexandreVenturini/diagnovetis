import type { Appointment, AppointmentFormData } from '../features/appointments/appointmentTypes'
import type { DateRange } from '../features/common/period'
import { supabase } from './storage/supabaseClient'

type AppointmentRow = {
  id: number
  dog_id?: number | null
  dog_name: string
  dog_age?: string | null
  dog_breed?: string | null
  kind: string
  tutor_name: string
  date: string
  time: string
  service_type: string
  veterinarian: string
  notes: string
  status: string
  cancellation_reason: string
  reminders: Appointment['reminders']
}

const LOAD_ERROR = 'Não foi possível carregar a agenda.'

function rowToAppointment(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    dogId: row.dog_id ?? undefined,
    dogName: row.dog_name,
    dogAge: row.dog_age ?? undefined,
    dogBreed: row.dog_breed ?? undefined,
    kind: row.kind as Appointment['kind'],
    tutorName: row.tutor_name,
    date: row.date,
    time: row.time,
    serviceType: row.service_type,
    veterinarian: row.veterinarian,
    notes: row.notes,
    status: row.status as Appointment['status'],
    cancellationReason: row.cancellation_reason ?? '',
    reminders: row.reminders ?? [],
  }
}

function changesToRow(changes: Partial<Appointment>): Partial<AppointmentRow> {
  const row: Partial<AppointmentRow> = {}
  if (changes.status !== undefined) row.status = changes.status
  if (changes.cancellationReason !== undefined) row.cancellation_reason = changes.cancellationReason
  if (changes.reminders !== undefined) row.reminders = changes.reminders
  if (changes.veterinarian !== undefined) row.veterinarian = changes.veterinarian
  if (changes.date !== undefined) row.date = changes.date
  if (changes.time !== undefined) row.time = changes.time
  if (changes.notes !== undefined) row.notes = changes.notes
  return row
}

const toAppointments = (rows: unknown[] | null) => (rows ?? []).map((row) => rowToAppointment(row as AppointmentRow))

export class AppointmentService {
  async listar(range: DateRange | null): Promise<Appointment[]> {
    if (!range) {
      const { data, error } = await supabase.from('agendamentos').select('*').order('date').order('time')
      if (error) throw new Error(LOAD_ERROR)
      return toAppointments(data)
    }
    const [inPeriod, noDate, nullDate] = await Promise.all([
      supabase
        .from('agendamentos')
        .select('*')
        .gte('date', range.start)
        .lte('date', range.end)
        .order('date')
        .order('time'),
      supabase.from('agendamentos').select('*').eq('date', ''),
      supabase.from('agendamentos').select('*').is('date', null),
    ])
    if (inPeriod.error) throw new Error(LOAD_ERROR)
    return toAppointments([...(inPeriod.data ?? []), ...(noDate.data ?? []), ...(nullDate.data ?? [])])
  }

  async listarComLembretes(): Promise<Appointment[]> {
    const { data } = await supabase.from('agendamentos').select('*').neq('reminders', '[]')
    return toAppointments(data).filter((item) => item.reminders.length > 0)
  }

  async temConflito(veterinarian: string, date: string, time: string, ignoreId?: number): Promise<boolean> {
    const { data } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('veterinarian', veterinarian)
      .eq('date', date)
      .eq('time', time)
    return toAppointments(data).some((item) => item.id !== ignoreId && item.status !== 'cancelled')
  }

  async criar(data: AppointmentFormData): Promise<Appointment | null> {
    const row: AppointmentRow = {
      id: Date.now(),
      dog_id: data.dogId ?? null,
      dog_name: data.dogName,
      dog_age: data.dogAge ?? null,
      dog_breed: data.dogBreed ?? null,
      kind: data.kind,
      tutor_name: data.tutorName,
      date: data.date,
      time: data.time,
      service_type: data.serviceType,
      veterinarian: data.veterinarian,
      notes: data.notes,
      status: 'confirmed',
      cancellation_reason: '',
      reminders: [],
    }
    const { error } = await supabase.from('agendamentos').insert(row)
    return error ? null : rowToAppointment(row)
  }

  async atualizar(id: number, changes: Partial<Appointment>): Promise<boolean> {
    const { error } = await supabase.from('agendamentos').update(changesToRow(changes)).eq('id', id)
    return !error
  }
}
