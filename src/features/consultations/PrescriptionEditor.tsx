import type { Prescription, PrescriptionItem } from './prescriptionReport'
import { emptyPrescriptionItem } from './prescriptionReport'

type Props = { value: Prescription; onChange: (value: Prescription) => void }
const fields: { key: keyof PrescriptionItem; label: string; placeholder: string }[] = [
  { key: 'medication', label: 'Medicamento e apresentação', placeholder: 'Nome, concentração e apresentação' },
  { key: 'dose', label: 'Dose por administração', placeholder: 'Informe a dose e a unidade' },
  { key: 'route', label: 'Via de administração', placeholder: 'Informe a via' },
  { key: 'frequency', label: 'Frequência', placeholder: 'Informe o intervalo entre as doses' },
  { key: 'duration', label: 'Duração do tratamento', placeholder: 'Informe a duração' },
  { key: 'quantity', label: 'Quantidade a dispensar', placeholder: 'Informe a quantidade e a unidade' },
]

export function PrescriptionEditor({ value, onChange }: Props) {
  return <section className="prescription-editor consultation-panel content-card" aria-labelledby="prescription-heading">
    <h2 id="prescription-heading">Receita do animal</h2>
    <p>Revise a dose, a via, a frequência, a duração e a quantidade de cada medicamento antes de visualizar e emitir.</p>
    <div className="consultation-form-grid"><label>CRMV / UF do veterinário<input value={value.crmv} onChange={(event) => onChange({ ...value, crmv: event.target.value })} placeholder="Número e UF" /></label></div>
    {value.items.map((item, index) => <fieldset key={index}><legend>Medicamento {index + 1}</legend><div className="consultation-form-grid">
      {fields.map((field) => <label key={field.key}>{field.label}<input value={item[field.key]} placeholder={field.placeholder} onChange={(event) => onChange({ ...value, items: value.items.map((current, i) => i === index ? { ...current, [field.key]: event.target.value } : current) })} /></label>)}
    </div><button className="secondary-button" type="button" disabled={value.items.length === 1} onClick={() => onChange({ ...value, items: value.items.filter((_, i) => i !== index) })}>Remover medicamento {index + 1}</button></fieldset>)}
    <button className="secondary-button" type="button" onClick={() => onChange({ ...value, items: [...value.items, emptyPrescriptionItem()] })}>+ Adicionar medicamento</button>
    <div className="consultation-textareas"><label>Orientações ao tutor<textarea value={value.instructions} onChange={(event) => onChange({ ...value, instructions: event.target.value })} placeholder="Cuidados e orientações complementares" /></label></div>
  </section>
}
