export type AppointmentKind = 'scheduled' | 'walk-in'
export type AppointmentStatus = 'confirmed' | 'waiting' | 'in-progress' | 'completed' | 'no-show' | 'cancelled'
export type AppointmentView = 'day' | 'week' | 'month'
export type ReminderType = 'return' | 'vaccination'

export type AppointmentReminder = {
  id: number
  type: ReminderType
  date: string
  done: boolean
}

export type Appointment = {
  id: number
  dogId?: number
  dogAge?: string
  dogBreed?: string
  kind: AppointmentKind
  dogName: string
  tutorName: string
  date: string
  time: string
  serviceType: string
  veterinarian: string
  notes: string
  status: AppointmentStatus
  cancellationReason: string
  reminders: AppointmentReminder[]
}

export type AppointmentFormData = Omit<Appointment, 'id' | 'status' | 'cancellationReason' | 'reminders'>
export type AppointmentScreen = 'list' | 'create'
