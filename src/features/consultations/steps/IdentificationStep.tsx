import { useMemo, useState } from 'react'
import type { ConsultationData } from '../consultationTypes'
import type { Appointment } from '../../appointments/appointmentTypes'

type IdentificationStepProps = {
  data: ConsultationData
  appointments: Appointment[]
  selectedAppointmentId: number | null
  onSelectAppointment: (id: number | null) => void
  update: (key: keyof ConsultationData, value: string) => void
  onNext: () => void
}

function formatAppointmentDate(date: string) {
  if (!date) return 'Data não informada'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${date}T12:00:00`))
}

export function IdentificationStep({ data, appointments, selectedAppointmentId, onSelectAppointment, update, onNext }: IdentificationStepProps) {
  const [appointmentQuery, setAppointmentQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const complete = data.dogName && data.age && data.breed && data.tutorName && data.veterinarian
  const normalizedQuery = appointmentQuery.trim().toLocaleLowerCase('pt-BR')
  const filteredAppointments = useMemo(() => appointments.filter((item) => {
    const searchable = `${item.dogName} ${item.tutorName} ${item.date} ${formatAppointmentDate(item.date)} ${item.time} ${item.serviceType} ${item.veterinarian}`.toLocaleLowerCase('pt-BR')
    return searchable.includes(normalizedQuery)
  }).slice(0, 8), [appointments, normalizedQuery])
  const selectedAppointment = appointments.find((appointment) => appointment.id === selectedAppointmentId)

  function chooseAppointment(item: Appointment) {
    onSelectAppointment(item.id)
    setAppointmentQuery('')
    setSearchOpen(false)
  }

  return (
    <section className="consultation-panel content-card">
      <h2>1. Identificação do Paciente</h2>
      <div className="appointment-import">
        <div><strong>Importar dados do agendamento</strong><p>Selecione uma consulta para preencher automaticamente a identificação do paciente.</p></div>
        <label className="consultation-appointment-search">Buscar agendamento
          <input value={appointmentQuery} onFocus={() => setSearchOpen(true)} onBlur={() => window.setTimeout(() => setSearchOpen(false), 120)} onChange={(event) => { setAppointmentQuery(event.target.value); setSearchOpen(true) }} placeholder="Digite o cão, tutor, data, horário ou serviço" autoComplete="off" />
          {searchOpen && normalizedQuery && <div className="consultation-appointment-results">{filteredAppointments.map((item) => <button type="button" key={item.id} onMouseDown={(event) => event.preventDefault()} onClick={() => chooseAppointment(item)}><span><strong>{item.dogName}</strong><small>Tutor: {item.tutorName} · {item.serviceType}</small></span><time>{formatAppointmentDate(item.date)}<b>{item.time || 'Sem horário'}</b></time></button>)}{filteredAppointments.length === 0 && <p>Nenhum agendamento encontrado para esta busca.</p>}</div>}
        </label>
        {selectedAppointment && <><div className="selected-appointment-heading"><strong>Agendamento selecionado</strong><button type="button" onClick={() => { onSelectAppointment(null); setAppointmentQuery('') }}>Remover vínculo</button></div><div className="imported-appointment-summary"><span><b>Paciente</b>{selectedAppointment.dogName}</span><span><b>Tutor</b>{selectedAppointment.tutorName}</span><span><b>Serviço</b>{selectedAppointment.serviceType}</span><span><b>Horário</b>{formatAppointmentDate(selectedAppointment.date)} às {selectedAppointment.time || 'Sem horário'}</span></div></>}
      </div>
      <div className="consultation-form-grid">
        <label>Nome do Cão *<input value={data.dogName} onChange={(event) => update('dogName', event.target.value)} placeholder="Ex: Rex" /></label>
        <label>Idade *<input value={data.age} onChange={(event) => update('age', event.target.value)} placeholder="Ex: 5 anos" /></label>
        <label>Raça *<select value={data.breed} onChange={(event) => update('breed', event.target.value)}><option value="">Selecione a raça</option><option>Labrador</option><option>Pastor Alemão</option><option>Golden Retriever</option><option>Poodle</option><option>Vira-lata</option></select></label>
        <label>Nome do Tutor *<input value={data.tutorName} onChange={(event) => update('tutorName', event.target.value)} placeholder="Ex: Maria Silva" /></label>
        <label>Veterinário que Atendeu *<input value={data.veterinarian} onChange={(event) => update('veterinarian', event.target.value)} placeholder="Ex: Dr. Carlos Souza" /></label>
      </div>
      <div className="consultation-next"><button className="primary-button" disabled={!complete} onClick={onNext}>Próximo: Histórico Clínico →</button></div>
    </section>
  )
}
