import type { Appointment } from '../appointments/appointmentTypes'
import type { Dog } from '../dogs/dogTypes'
import { EMPTY_CONSULTATION, type ConsultationData } from './consultationTypes'

export function consultationFromAppointment(appointment: Appointment, dogs: Dog[], current: ConsultationData = EMPTY_CONSULTATION): ConsultationData {
  const normalize = (value: string) => value.trim().toLocaleLowerCase('pt-BR')
  const dog = appointment.dogId !== undefined
    ? dogs.find(item => item.id === appointment.dogId)
    : dogs.find(item => normalize(item.name) === normalize(appointment.dogName) && normalize(item.tutor) === normalize(appointment.tutorName))
  return {
    ...current,
    dogName: appointment.dogName,
    tutorName: appointment.tutorName,
    veterinarian: appointment.veterinarian,
    age: dog?.age || appointment.dogAge || '',
    breed: dog?.breed || appointment.dogBreed || '',
    mainComplaint: current.mainComplaint || appointment.serviceType,
    history: current.history || [dog?.history, appointment.notes].filter(Boolean).join('\n'),
  }
}
