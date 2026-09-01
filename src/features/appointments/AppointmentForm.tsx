import { useState } from 'react'
import type { FormEvent } from 'react'
import { EMPTY_APPOINTMENT } from './appointmentData'
import type { AppointmentFormData } from './appointmentTypes'
import type { Dog } from '../dogs/dogTypes'

type AppointmentFormProps = {
  onSave: (data: AppointmentFormData) => boolean
  onCancel: () => void
  error?: string
  dogs: Dog[]
}

export function AppointmentForm({ onSave, onCancel, error, dogs }: AppointmentFormProps) {
  const [form, setForm] = useState<AppointmentFormData>(EMPTY_APPOINTMENT)
  const [dogQuery, setDogQuery] = useState('')
  const [tutorQuery, setTutorQuery] = useState('')
  const [dogSearchOpen, setDogSearchOpen] = useState(false)
  const [tutorSearchOpen, setTutorSearchOpen] = useState(false)
  const [searchError, setSearchError] = useState('')

  function update(key: keyof AppointmentFormData, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.dogId) { setSearchError('Selecione um cão cadastrado na lista de resultados.'); setDogSearchOpen(true); return }
    onSave(form)
  }

  const normalizedDogQuery = dogQuery.trim().toLocaleLowerCase('pt-BR')
  const normalizedTutorQuery = tutorQuery.trim().toLocaleLowerCase('pt-BR')
  const dogResults = dogs.filter((dog) => (!normalizedDogQuery || `${dog.name} ${dog.breed}`.toLocaleLowerCase('pt-BR').includes(normalizedDogQuery)) && (!normalizedTutorQuery || dog.tutor.toLocaleLowerCase('pt-BR').includes(normalizedTutorQuery))).slice(0, 6)
  const tutors = [...new Map(dogs.map((dog) => [dog.tutor.trim().toLocaleLowerCase('pt-BR'), { name: dog.tutor, contact: dog.contact }])).values()]
  const tutorResults = tutors.filter((tutor) => !normalizedTutorQuery || `${tutor.name} ${tutor.contact}`.toLocaleLowerCase('pt-BR').includes(normalizedTutorQuery)).slice(0, 6)

  function selectDog(dog: Dog) {
    setForm((current) => ({ ...current, dogId: dog.id, dogName: dog.name, dogAge: dog.age, dogBreed: dog.breed, tutorName: dog.tutor }))
    setDogQuery(dog.name); setTutorQuery(dog.tutor); setDogSearchOpen(false); setTutorSearchOpen(false); setSearchError('')
  }

  function searchDog(value: string) {
    setDogQuery(value); setDogSearchOpen(true); setSearchError('')
    if (value !== form.dogName) setForm((current) => ({ ...current, dogId: undefined, dogName: '', dogAge: '', dogBreed: '' }))
  }

  function selectTutor(name: string) {
    setTutorQuery(name); setTutorSearchOpen(false); setDogSearchOpen(true)
    setForm((current) => current.tutorName === name ? current : { ...current, dogId: undefined, dogName: '', dogAge: '', dogBreed: '', tutorName: name })
    if (form.tutorName !== name) setDogQuery('')
  }

  return (
    <section className="content-card appointment-form-card">
      <h2>Agendar Consulta</h2>
      <form className="appointment-form" onSubmit={submit}>
        <label className="appointment-search-field">Buscar cão<input value={dogQuery} onFocus={() => setDogSearchOpen(true)} onChange={(event) => searchDog(event.target.value)} placeholder="Digite o nome ou a raça do cão" autoComplete="off" required />{dogSearchOpen && normalizedDogQuery && <div className="appointment-search-results">{dogResults.map((dog) => <button type="button" key={dog.id} onMouseDown={(event) => event.preventDefault()} onClick={() => selectDog(dog)}><i>{dog.name.charAt(0).toUpperCase()}</i><span><strong>{dog.name}</strong><small>{dog.breed} · Tutor: {dog.tutor}</small></span></button>)}{dogResults.length === 0 && <p>Nenhum cão encontrado para esta busca.</p>}</div>}{dogs.length === 0 && <small className="field-help warning">Cadastre um cão antes de criar o agendamento.</small>}</label>
        <label className="appointment-search-field">Buscar tutor<input value={tutorQuery} onFocus={() => setTutorSearchOpen(true)} onChange={(event) => { setTutorQuery(event.target.value); setTutorSearchOpen(true); if (event.target.value !== form.tutorName) setForm((current) => ({ ...current, dogId: undefined, dogName: '', tutorName: event.target.value })) }} placeholder="Digite o nome ou contato do tutor" autoComplete="off" required />{tutorSearchOpen && normalizedTutorQuery && <div className="appointment-search-results">{tutorResults.map((tutor) => <button type="button" key={tutor.name} onMouseDown={(event) => event.preventDefault()} onClick={() => selectTutor(tutor.name)}><i>{tutor.name.charAt(0).toUpperCase()}</i><span><strong>{tutor.name}</strong><small>{tutor.contact} · {dogs.filter((dog) => dog.tutor === tutor.name).length} cão(ões)</small></span></button>)}{tutorResults.length === 0 && <p>Nenhum tutor encontrado para esta busca.</p>}</div>}</label>

        {form.dogId && (() => { const dog = dogs.find((item) => item.id === form.dogId); return dog ? <div className="scheduled-dog-summary full-field"><span><b>Paciente selecionado</b>{dog.name}</span><span><b>Raça</b>{dog.breed}</span><span><b>Idade</b>{dog.age} ano(s)</span><span><b>Peso</b>{dog.weight} kg</span><span><b>Tutor</b>{dog.tutor}</span><span><b>Contato</b>{dog.contact}</span></div> : null })()}

        <label>Data<input type="date" value={form.date} onChange={(event) => update('date', event.target.value)} required /></label><label>Horário<input type="time" value={form.time} onChange={(event) => update('time', event.target.value)} required /></label>

        <label>Tipo de Atendimento<select value={form.serviceType} onChange={(event) => update('serviceType', event.target.value)} required><option value="">Selecione</option><option>Consulta de Rotina</option><option>Vacinação</option><option>Retorno</option><option>Emergência</option><option>Exames</option></select></label>
        <div aria-hidden="true" />
        <label>Veterinário Responsável<input value={form.veterinarian} onChange={(event) => update('veterinarian', event.target.value)} placeholder="Nome do veterinário" required /></label>
        <label>Observações<input value={form.notes} onChange={(event) => update('notes', event.target.value)} placeholder="Observações sobre o agendamento" /></label>

        {(error || searchError) && <p className="form-message error full-field" role="alert">{error || searchError}</p>}
        <div className="form-actions full-field">
          <button className="primary-button" type="submit">Confirmar Agendamento</button>
          <button className="secondary-button" type="button" onClick={onCancel}>Cancelar</button>
        </div>
      </form>
    </section>
  )
}
