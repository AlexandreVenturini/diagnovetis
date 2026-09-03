import { useState } from 'react'
import type { FormEvent } from 'react'
import type { TutorFormData } from './tutorTypes'

type TutorFormProps = {
  initialName: string
  initialPhone: string
  onSave: (data: TutorFormData) => Promise<void>
  onCancel: () => void
}

function today() {
  const date = new Date()
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

export function TutorForm({ initialName, initialPhone, onSave, onCancel }: TutorFormProps) {
  const [form, setForm] = useState<TutorFormData>({
    name: initialName,
    cpf: '',
    phone: initialPhone,
    email: '',
    registrationDate: today(),
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function update(key: keyof TutorFormData, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      await onSave(form)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível cadastrar o tutor.')
    } finally {
      setSaving(false)
    }
  }

  return <form className="dog-form tutor-form" onSubmit={submit}>
    <div className="tutor-form-notice full-field" role="status">
      <strong>Tutor não encontrado</strong>
      <p>Preencha o cadastro completo. Depois disso, o cão será salvo automaticamente.</p>
    </div>
    <label>Nome<input value={form.name} onChange={(event) => update('name', event.target.value)} required /></label>
    <label>CPF<input value={form.cpf} onChange={(event) => update('cpf', event.target.value)} placeholder="000.000.000-00" /></label>
    <label>Telefone<input type="tel" value={form.phone} onChange={(event) => update('phone', event.target.value)} placeholder="(27) 99999-9999" required /></label>
    <label>Email<input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="nome@email.com" required /></label>
    <label>Data de cadastro<input type="date" value={form.registrationDate} onChange={(event) => update('registrationDate', event.target.value)} required /></label>
    <div className="address-heading full-field"><strong>Endereço</strong></div>
    <label>Rua<input value={form.street} onChange={(event) => update('street', event.target.value)} required /></label>
    <label>Número<input type="number" min="0" value={form.number} onChange={(event) => update('number', event.target.value)} required /></label>
    <label>Bairro<input value={form.neighborhood} onChange={(event) => update('neighborhood', event.target.value)} required /></label>
    <label>Cidade<input value={form.city} onChange={(event) => update('city', event.target.value)} required /></label>
    <label>UF<input value={form.state} onChange={(event) => update('state', event.target.value.slice(0, 2).toUpperCase())} minLength={2} maxLength={2} placeholder="ES" required /></label>
    <label>CEP<input value={form.zipCode} onChange={(event) => update('zipCode', event.target.value)} placeholder="29000-000" required /></label>
    {error && <p className="form-error full-field" role="alert">{error}</p>}
    <div className="form-actions full-field">
      <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Cadastrando...' : 'Cadastrar tutor e salvar cão'}</button>
      <button className="secondary-button" type="button" onClick={onCancel} disabled={saving}>Voltar</button>
    </div>
  </form>
}
