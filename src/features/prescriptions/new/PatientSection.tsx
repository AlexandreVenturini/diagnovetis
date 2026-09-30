import type { Medico } from '../../../models/Medico'
import type { Dog } from '../../dogs/dogTypes'
import { AnimalSearch } from './AnimalSearch'
import type { PrescriptionDraft } from './usePrescriptionDraft'

type PatientSectionProps = {
  dogs: Dog[]
  medicos: Medico[]
  draft: PrescriptionDraft
  isStudent: boolean
}

export function PatientSection({ dogs, medicos, draft, isStudent }: PatientSectionProps) {
  const { dog } = draft
  return (
    <section className="content-card consultation-panel">
      <h3>1. Animal, tutor e veterinário</h3>
      <div className="consultation-form-grid">
        <AnimalSearch dogs={dogs} selected={dog} onSelect={draft.selectDog} />
        <label>
          Tutor
          <input readOnly value={dog?.tutor ?? ''} />
        </label>
        <label>
          Identificação
          <input readOnly value={dog ? `#${dog.id} · ${dog.breed} · ${dog.sex}` : ''} />
        </label>
        <label>
          Peso atual (kg)
          <input
            inputMode="decimal"
            value={draft.weight}
            onChange={(event) => draft.changeWeight(event.target.value)}
          />
        </label>
        {isStudent ? (
          <label>
            Veterinário
            <input readOnly value="Definido na aprovação da receita" />
          </label>
        ) : (
          <label>
            Veterinário
            <select value={draft.vetId} onChange={(event) => draft.selectVet(event.target.value)}>
              <option value="">Selecione o veterinário</option>
              {medicos.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome} — {item.crmv}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </section>
  )
}
