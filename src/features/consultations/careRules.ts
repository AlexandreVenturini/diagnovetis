import type { Appointment } from '../appointments/appointmentTypes'
import type { Liberacao, VeterinarianOption } from '../supervision/supervisionTypes'
import type { ConsultationData, ConsultationStep } from './consultationTypes'
import { validateExam, type ExamDraft } from './examTypes'

const normalize = (value: string) => value.trim().toLocaleLowerCase('pt-BR')

export function applyVeterinarian(
  data: ConsultationData,
  veterinarians: VeterinarianOption[],
  liberacao: Liberacao | null,
  userEmail?: string,
): ConsultationData {
  if (liberacao)
    return { ...data, veterinarian: liberacao.supervisor.nome, veterinarianId: String(liberacao.supervisor.medicoId) }
  if (data.veterinarianId && veterinarians.some((vet) => String(vet.medicoId) === data.veterinarianId)) return data
  const vet =
    (data.veterinarian && veterinarians.find((item) => normalize(item.nome) === normalize(data.veterinarian))) ||
    (userEmail && veterinarians.find((item) => normalize(item.email) === normalize(userEmail)))
  return vet
    ? { ...data, veterinarian: vet.nome, veterinarianId: String(vet.medicoId) }
    : { ...data, veterinarianId: '' }
}

export function openAppointments(appointments: Appointment[]) {
  return appointments
    .filter((item) => !['completed', 'cancelled', 'no-show'].includes(item.status))
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
}

export function validateConsultation(
  data: ConsultationData,
  exams: ExamDraft[],
): { message: string; step: ConsultationStep } | null {
  if (![data.dogName, data.tutorName, data.veterinarianId].every((value) => value.trim()))
    return { message: 'Preencha a identificação do paciente antes de finalizar.', step: 1 }
  const examError = exams.map(validateExam).find(Boolean)
  return examError ? { message: examError, step: 4 } : null
}
