import { useState } from 'react'
import { CalculatorIcon, PillIcon } from './MedicationIcons'
import type { Medication } from './medicationTypes'

const formatNumber = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })

function calculateDose(medication: Medication, weight: string) {
  const kg = Number(weight.replace(',', '.'))
  if (!kg || kg <= 0) return 'Informe um peso válido.'
  const mg = kg * medication.doseMgKg
  const volume = medication.concentrationMgMl ? ` (${formatNumber(mg / medication.concentrationMgMl)} mL)` : ''
  return `${formatNumber(mg)} mg por administração${volume}`
}

function ItemList({ items }: { items: string[] }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

export function MedicationDetails({ medication }: { medication: Medication | null }) {
  const [weight, setWeight] = useState('')
  const [result, setResult] = useState<string | null>(null)

  if (!medication)
    return (
      <aside className="medication-details empty">
        <PillIcon />
        <p>Selecione um medicamento ao lado para ver os detalhes e calcular a dose</p>
      </aside>
    )

  return (
    <aside className="medication-details" key={medication.id}>
      <h3>{medication.commercialName}</h3>
      <p className="active-ingredient">{medication.activeIngredient}</p>
      <div className="medication-summary">
        <p>
          <b>Dosagem:</b> {medication.dosage}
        </p>
        <p>
          <b>Frequência:</b> {medication.frequency}
        </p>
        <p>
          <b>Via:</b> {medication.route}
        </p>
        <p>
          <b>Concentração:</b> {medication.concentration}
        </p>
      </div>
      <section className="medication-section">
        <h4>Indicações Clínicas</h4>
        <ItemList items={medication.indications} />
      </section>
      {medication.contraindications.length > 0 && (
        <section className="medication-alert">
          <h4>
            <span>△</span>Contraindicações
          </h4>
          <ItemList items={medication.contraindications} />
        </section>
      )}
      <section className="medication-notes">
        <h4>Observações</h4>
        <p>{medication.notes || 'Sem observações adicionais.'}</p>
      </section>
      <section className="dose-calculator">
        <h4>
          <CalculatorIcon />
          Calculadora de Dose
        </h4>
        <label>
          Peso do Animal (kg)
          <input
            inputMode="decimal"
            value={weight}
            onChange={(event) => {
              setWeight(event.target.value)
              setResult(null)
            }}
            placeholder="Ex: 25.5"
          />
        </label>
        <button type="button" onClick={() => setResult(calculateDose(medication, weight))}>
          <CalculatorIcon />
          Calcular Dose
        </button>
        {result && <output>{result}</output>}
      </section>
    </aside>
  )
}
