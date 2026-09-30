import type { PrescriptionDraft } from './usePrescriptionDraft'

const format = (value: number) => value.toLocaleString('pt-BR', { maximumSignificantDigits: 8 })

export function DoseCalculator({ draft }: { draft: PrescriptionDraft }) {
  const { calculation, doseFeedback } = draft
  return (
    <section className="content-card consultation-panel">
      <h3>3. Calcular dose (opcional)</h3>
      <p>Conversão para soluções em mg/mL. Informe a dose em mg/kg por administração definida pelo veterinário.</p>
      <div className="consultation-form-grid">
        <label>
          Medicamento do cálculo
          <select value={draft.targetItem} onChange={(event) => draft.selectTarget(Number(event.target.value))}>
            {draft.prescription.items.map((item, index) => (
              <option key={index} value={index}>
                {index + 1}. {item.medication || 'Medicamento sem nome'}
              </option>
            ))}
          </select>
        </label>
        <label>
          Dose (mg/kg por administração)
          <input inputMode="decimal" value={draft.mgKg} onChange={(event) => draft.setMgKg(event.target.value)} />
        </label>
        <label>
          Concentração (mg/mL)
          <input
            inputMode="decimal"
            value={draft.concentration}
            onChange={(event) => draft.setConcentration(event.target.value)}
          />
        </label>
      </div>
      {calculation && (
        <p>
          {draft.weight} kg × {draft.mgKg} mg/kg = <strong>{format(calculation.mg)} mg</strong> →{' '}
          <strong>{format(calculation.ml)} mL por administração</strong>
        </p>
      )}
      <button type="button" className="primary-button rx-dose-apply" onClick={draft.applyDose}>
        Aplicar dose ao medicamento
      </button>
      {doseFeedback && (
        <p
          className={doseFeedback.error ? 'rx-dose-feedback error' : 'rx-dose-feedback'}
          role={doseFeedback.error ? 'alert' : 'status'}
        >
          {doseFeedback.text}
        </p>
      )}
    </section>
  )
}
