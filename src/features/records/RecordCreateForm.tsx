import { useState } from 'react'
import type { ClinicalRecord, PatientRecord, RecordKind } from './recordTypes'

const KIND_OPTIONS: RecordKind[] = ['Consulta', 'Vacina', 'Exame', 'Tratamento', 'Retorno']

type FormData = {
  kind: RecordKind
  date: string
  veterinarian: string
  crmv: string
  students: string
  description: string
  diagnosis: string
  conduct: string
  exams: string
  prescriptions: string
  weight: string
  attachments: string[]
}

const EMPTY_FORM: FormData = {
  kind: 'Consulta',
  date: new Date().toISOString().slice(0, 10),
  veterinarian: '',
  crmv: '',
  students: '',
  description: '',
  diagnosis: '',
  conduct: '',
  exams: '',
  prescriptions: '',
  weight: '',
  attachments: [],
}

function splitLines(value: string) {
  return value.split('\n').map((s) => s.trim()).filter(Boolean)
}

type RecordCreateFormProps = {
  selected: PatientRecord
  nextId: number
  onSave: (record: ClinicalRecord, weight: string) => void
  onCancel: () => void
}

export function RecordCreateForm({ selected, nextId, onSave, onCancel }: RecordCreateFormProps) {
  const [form, setForm] = useState<FormData>(EMPTY_FORM)

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    update('attachments', Array.from(event.target.files ?? []).map((f) => f.name))
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const record: ClinicalRecord = {
      id: nextId,
      kind: form.kind,
      date: form.date,
      veterinarian: form.veterinarian,
      crmv: form.crmv,
      students: splitLines(form.students.replaceAll(',', '\n')),
      description: form.description,
      diagnosis: form.diagnosis,
      conduct: form.conduct,
      exams: splitLines(form.exams),
      attachments: form.attachments,
      prescriptions: splitLines(form.prescriptions),
      validation: 'pending',
      validatedBy: '',
    }
    onSave(record, form.weight)
  }

  return (
    <section className="record-form-card content-card">
      <div className="records-heading">
        <div>
          <h2>Adicionar registro ao prontuário</h2>
          <p>Paciente: <strong>{selected.dogName}</strong> · Tutor: {selected.tutorName}</p>
        </div>
        <button className="secondary-button" onClick={onCancel}>Voltar</button>
      </div>

      <form className="record-form" onSubmit={handleSubmit}>
        <label>
          Tipo de registro
          <select value={form.kind} onChange={(e) => update('kind', e.target.value as RecordKind)}>
            {KIND_OPTIONS.map((k) => <option key={k}>{k}</option>)}
          </select>
        </label>

        <label>
          Data
          <input type="date" value={form.date} onChange={(e) => update('date', e.target.value)} required />
        </label>

        <label>
          Veterinário responsável
          <input value={form.veterinarian} onChange={(e) => update('veterinarian', e.target.value)} placeholder="Nome do profissional" required />
        </label>

        <label>
          CRMV
          <input value={form.crmv} onChange={(e) => update('crmv', e.target.value)} placeholder="CRMV-ES 0000" required />
        </label>

        <label className="full-field">
          Alunos participantes
          <input value={form.students} onChange={(e) => update('students', e.target.value)} placeholder="Separe os nomes por vírgulas" />
        </label>

        <label className="full-field">
          Descrição clínica
          <textarea value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Anamnese, sinais clínicos e detalhes do atendimento" required />
        </label>

        <label>
          Diagnóstico
          <textarea value={form.diagnosis} onChange={(e) => update('diagnosis', e.target.value)} placeholder="Diagnóstico ou hipótese diagnóstica" />
        </label>

        <label>
          Conduta
          <textarea value={form.conduct} onChange={(e) => update('conduct', e.target.value)} placeholder="Tratamento, orientações e acompanhamento" />
        </label>

        <label>
          Exames solicitados ou realizados
          <textarea value={form.exams} onChange={(e) => update('exams', e.target.value)} placeholder="Um exame por linha" />
        </label>

        <label>
          Prescrições e receitas
          <textarea value={form.prescriptions} onChange={(e) => update('prescriptions', e.target.value)} placeholder="Medicamento, dose, frequência e duração" />
        </label>

        <label>
          Peso atual (kg)
          <input type="number" min="0" step="0.1" value={form.weight} onChange={(e) => update('weight', e.target.value)} placeholder="Ex.: 28,5" />
        </label>

        <label>
          Anexos
          <input className="record-file-input" type="file" multiple onChange={handleFiles} />
          <span className="file-help">
            {form.attachments.length ? form.attachments.join(', ') : 'PDFs, imagens ou resultados de exames'}
          </span>
        </label>

        <div className="record-validation-notice full-field">
          <span>✓</span>
          <p>
            <strong>Fluxo de validação</strong>
            Este registro será salvo como "Aguardando validação" até a confirmação do profissional responsável.
          </p>
        </div>

        <div className="form-actions full-field">
          <button className="primary-button" type="submit">Salvar registro</button>
          <button className="secondary-button" type="button" onClick={onCancel}>Cancelar</button>
        </div>
      </form>
    </section>
  )
}
