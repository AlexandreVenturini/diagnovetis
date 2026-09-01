import type { AppointmentFormData } from './appointmentTypes'

export const EMPTY_APPOINTMENT: AppointmentFormData = {
  kind: 'scheduled',
  dogId: undefined,
  dogAge: '',
  dogBreed: '',
  dogName: '',
  tutorName: '',
  date: '',
  time: '',
  serviceType: '',
  veterinarian: '',
  notes: '',
}
