import { useState, useCallback, useEffect } from 'react'
import type { Appointment, AppointmentFormData } from '../features/appointments/appointmentTypes'
import { supabase } from '../services/storage/supabaseClient'
import { useRangeData } from '../features/common/useRangeData'
import type { DateRange } from '../features/common/period'

type Row = {
  id: number
  dog_id?: number
  dog_name: string
  dog_age?: string
  dog_breed?: string
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

function rowToAppointment(r: Row): Appointment {
  return {
    id: r.id,
    dogId: r.dog_id,
    dogName: r.dog_name,
    dogAge: r.dog_age,
    dogBreed: r.dog_breed,
    kind: r.kind as Appointment['kind'],
    tutorName: r.tutor_name,
    date: r.date,
    time: r.time,
    serviceType: r.service_type,
    veterinarian: r.veterinarian,
    notes: r.notes,
    status: r.status as Appointment['status'],
    cancellationReason: r.cancellation_reason ?? '',
    reminders: r.reminders ?? [],
  }
}

async function fetchAppointments(range: DateRange | null): Promise<Appointment[]> {
  if (!range) {
    const { data, error } = await supabase.from('agendamentos').select('*').order('date').order('time')
    if (error) throw new Error('Não foi possível carregar a agenda.')
    return (data ?? []).map((r) => rowToAppointment(r as Row))
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
  if (inPeriod.error) throw new Error('Não foi possível carregar a agenda.')
  return [...(inPeriod.data ?? []), ...(noDate.data ?? []), ...(nullDate.data ?? [])].map((r) =>
    rowToAppointment(r as Row),
  )
}

async function fetchReminderAppointments(): Promise<Appointment[]> {
  const { data } = await supabase.from('agendamentos').select('*').neq('reminders', '[]')
  return (data ?? []).map((r) => rowToAppointment(r as Row)).filter((item) => item.reminders.length > 0)
}

export function useAppointments(range: DateRange | null = null) {
  const {
    items: appointments,
    loading,
    error,
    refresh,
    upsert,
  } = useRangeData(fetchAppointments, (item: Appointment) => item.id, range)
  const [reminderAppointments, setReminderAppointments] = useState<Appointment[]>([])

  const refreshReminders = useCallback(async () => {
    setReminderAppointments(await fetchReminderAppointments().catch(() => []))
  }, [])

  useEffect(() => {
    let active = true
    fetchReminderAppointments()
      .then((rows) => {
        if (active) setReminderAppointments(rows)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const hasConflict = useCallback(async (veterinarian: string, date: string, time: string, ignoreId?: number) => {
    const { data } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('veterinarian', veterinarian)
      .eq('date', date)
      .eq('time', time)
    return (data ?? []).some((a: Row) => a.id !== ignoreId && a.status !== 'cancelled')
  }, [])

  const createAppointment = useCallback(
    async (data: AppointmentFormData): Promise<boolean> => {
      if (data.kind === 'scheduled' && (await hasConflict(data.veterinarian, data.date, data.time))) return false

      const id = Date.now()
      const row = {
        id,
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
      if (error) return false
      upsert([rowToAppointment(row as unknown as Row)])
      return true
    },
    [hasConflict, upsert],
  )

  const updateAppointment = useCallback(
    async (id: number, changes: Partial<Appointment>) => {
      const mapped: Partial<Row> = {}
      if (changes.status !== undefined) mapped.status = changes.status
      if (changes.cancellationReason !== undefined) mapped.cancellation_reason = changes.cancellationReason
      if (changes.reminders !== undefined) mapped.reminders = changes.reminders
      if (changes.veterinarian !== undefined) mapped.veterinarian = changes.veterinarian
      if (changes.date !== undefined) mapped.date = changes.date
      if (changes.time !== undefined) mapped.time = changes.time
      if (changes.notes !== undefined) mapped.notes = changes.notes
      const { error } = await supabase
        .from('agendamentos')
        .update(mapped as Record<string, unknown>)
        .eq('id', id)
      if (error) return false
      const current = appointments.find((item) => item.id === id)
      if (current) upsert([{ ...current, ...changes }])
      else await refresh()
      if (changes.reminders !== undefined) await refreshReminders()
      return true
    },
    [appointments, upsert, refresh, refreshReminders],
  )

  return { appointments, reminderAppointments, loading, error, hasConflict, createAppointment, updateAppointment }
}
