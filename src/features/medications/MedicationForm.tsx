import type { FormEvent } from 'react'
import type { MedicationFormData } from './medicationTypes'

type MedicationFormProps = {
  form: MedicationFormData
  onChange: <K extends keyof MedicationFormData>(key: K, value: MedicationFormData[K]) => void
  saving: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

export function MedicationForm({ form, onChange, saving, onSubmit, onCancel }: MedicationFormProps) {
  return (
    <form className="medication-form content-card" onSubmit={onSubmit}>
      <div>
        <h3>Cadastrar novo medicamento</h3>
        <p>Adicione as informações terapêuticas para consulta da equipe veterinária.</p>
      </div>
      <div className="medication-form-grid">
        <label>
          Nome comercial
          <input required value={form.commercialName} onChange={(e) => onChange('commercialName', e.target.value)} />
        </label>
        <label>
          Princípio ativo
          <input
            required
            value={form.activeIngredient}
            onChange={(e) => onChange('activeIngredient', e.target.value)}
          />
        </label>
        <label className="full-field">
          Indicações clínicas
          <input
            required
            value={form.indications}
            onChange={(e) => onChange('indications', e.target.value)}
            placeholder="Separe por vírgulas"
          />
        </label>
        <label>
          Dosagem exibida
          <input
            required
            value={form.dosage}
            onChange={(e) => onChange('dosage', e.target.value)}
            placeholder="Ex.: 2 mg/kg"
          />
        </label>
        <label>
          Dose para cálculo (mg/kg)
          <input
            required
            min="0"
            step="0.01"
            type="number"
            value={form.doseMgKg || ''}
            onChange={(e) => onChange('doseMgKg', Number(e.target.value))}
          />
        </label>
        <label>
          Frequência
          <input required value={form.frequency} onChange={(e) => onChange('frequency', e.target.value)} />
        </label>
        <label>
          Via
          <input required value={form.route} onChange={(e) => onChange('route', e.target.value)} />
        </label>
        <label>
          Concentração exibida
          <input
            required
            value={form.concentration}
            onChange={(e) => onChange('concentration', e.target.value)}
            placeholder="Ex.: 30 mg/mL"
          />
        </label>
        <label>
          Concentração líquida (mg/mL, opcional)
          <input
            min="0"
            step="0.01"
            type="number"
            value={form.concentrationMgMl ?? ''}
            onChange={(e) => onChange('concentrationMgMl', e.target.value ? Number(e.target.value) : null)}
          />
        </label>
        <label className="full-field">
          Contraindicações
          <input
            value={form.contraindications}
            onChange={(e) => onChange('contraindications', e.target.value)}
            placeholder="Separe por vírgulas"
          />
        </label>
        <label className="full-field">
          Observações
          <textarea value={form.notes} onChange={(e) => onChange('notes', e.target.value)} />
        </label>
      </div>
      <div className="form-actions">
        <button className="primary-button" type="submit" disabled={saving}>
          {saving ? 'Cadastrando...' : 'Cadastrar medicamento'}
        </button>
        <button className="secondary-button" type="button" onClick={onCancel} disabled={saving}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
