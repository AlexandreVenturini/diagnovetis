import { useState } from 'react'
import { AppointmentForm } from './AppointmentForm'
import { AppointmentList } from './AppointmentList'
import { useAppointments } from '../../hooks/useAppointments'
import type { AppointmentFormData, AppointmentScreen } from './appointmentTypes'

type AppointmentsModuleProps = { initialScreen?: AppointmentScreen }

export function AppointmentsModule({ initialScreen = 'list' }: AppointmentsModuleProps) {
  const [screen, setScreen] = useState<AppointmentScreen>(initialScreen)
  const [formError, setFormError] = useState('')
  const { appointments, createAppointment, updateAppointment } = useAppointments()

  function handleCreate(data: AppointmentFormData) {
    const ok = createAppointment(data)
    if (!ok) {
      setFormError('Este veterinário já possui uma consulta agendada nesse horário.')
      return false
    }
    setFormError('')
    setScreen('list')
    return true
  }

  if (screen === 'create') {
    return <AppointmentForm onSave={handleCreate} onCancel={() => { setFormError(''); setScreen('list') }} error={formError} />
  }

  return <AppointmentList appointments={appointments} onCreate={() => setScreen('create')} onUpdate={updateAppointment} />
}
