import { useCallback, useEffect, useState } from 'react'
import { AppointmentService } from '../../services/AppointmentService'
import type { DateRange } from '../common/period'
import { useRangeData } from '../common/useRangeData'
import type { Appointment, AppointmentFormData } from './appointmentTypes'

const appointmentService = new AppointmentService()
const fetchAppointments = (range: DateRange | null) => appointmentService.listar(range)

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
    setReminderAppointments(await appointmentService.listarComLembretes().catch(() => []))
  }, [])

  useEffect(() => {
    let active = true
    appointmentService
      .listarComLembretes()
      .then((rows) => {
        if (active) setReminderAppointments(rows)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const hasConflict = useCallback(
    (veterinarian: string, date: string, time: string, ignoreId?: number) =>
      appointmentService.temConflito(veterinarian, date, time, ignoreId),
    [],
  )

  const createAppointment = useCallback(
    async (data: AppointmentFormData): Promise<boolean> => {
      if (data.kind === 'scheduled' && (await hasConflict(data.veterinarian, data.date, data.time))) return false
      const created = await appointmentService.criar(data)
      if (!created) return false
      upsert([created])
      return true
    },
    [hasConflict, upsert],
  )

  const updateAppointment = useCallback(
    async (id: number, changes: Partial<Appointment>) => {
      if (!(await appointmentService.atualizar(id, changes))) return false
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
