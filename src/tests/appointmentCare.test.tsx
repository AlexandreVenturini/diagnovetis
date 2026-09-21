import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { AppointmentList } from '../features/appointments/AppointmentList'
import type { Appointment } from '../features/appointments/appointmentTypes'
import { ClinicalCareModule } from '../features/consultations/ClinicalCareModule'
import { consultationFromAppointment } from '../features/consultations/consultationFromAppointment'
import type { Dog } from '../features/dogs/dogTypes'

const appointment: Appointment = {
  id: 42, dogId: 2, dogName: 'Rex', tutorName: 'Maria', veterinarian: 'Dra. Ana',
  date: '2026-09-21', time: '09:30', kind: 'scheduled', serviceType: 'Retorno',
  notes: 'Reavaliar exames', status: 'confirmed', cancellationReason: '', reminders: [],
  dogAge: '3 anos', dogBreed: 'Poodle',
}
const dogs: Dog[] = [
  { id: 1, name: 'Rex', tutor: 'José', age: '9 anos', breed: 'Labrador', history: 'Outro paciente', weight: '', sex: '', contact: '' },
  { id: 2, name: 'Rex', tutor: 'Maria', age: '4 anos', breed: 'Poodle', history: 'Histórico de Maria', weight: '', sex: '', contact: '' },
]

describe('Atendimento a partir da agenda', () => {
  it('preenche o paciente correto pelo vínculo e combina histórico e observações', () => {
    expect(consultationFromAppointment(appointment, dogs)).toMatchObject({ dogName: 'Rex', tutorName: 'Maria', veterinarian: 'Dra. Ana', age: '4 anos', breed: 'Poodle', mainComplaint: 'Retorno', history: 'Histórico de Maria\nReavaliar exames' })
    expect(consultationFromAppointment({ ...appointment, dogId: undefined }, dogs).age).toBe('4 anos')
    expect(consultationFromAppointment(appointment, []).age).toBe('3 anos')
  })
  it('mostra a ação apenas para situações abertas e perfil com acesso ao atendimento', () => {
    for (const status of ['confirmed', 'waiting', 'in-progress', 'completed', 'cancelled', 'no-show'] as const) {
      const html = renderToStaticMarkup(<AppointmentList appointments={[{ ...appointment, status }]} onCreate={() => {}} onUpdate={() => {}} onStartCare={() => {}} />)
      expect(html.includes('Ir para atendimento')).toBe(['confirmed', 'waiting', 'in-progress'].includes(status))
    }
    const html = renderToStaticMarkup(<AppointmentList appointments={[appointment]} onCreate={() => {}} onUpdate={() => {}} />)
    expect(html).not.toContain('Ir para atendimento')
  })
  it('abre a identificação preenchida imediatamente sem esperar outra busca da agenda', () => {
    const html = renderToStaticMarkup(<ClinicalCareModule dogs={dogs} initialAppointment={appointment} />)
    expect(html).toContain('value="Rex"')
    expect(html).toContain('value="Maria"')
    expect(html).toContain('value="Dra. Ana"')
    expect(html).toContain('value="4 anos"')
  })
})
