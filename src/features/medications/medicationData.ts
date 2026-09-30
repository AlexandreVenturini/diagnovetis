import { Medicamento } from '../../models/Medicamento'
import type { Medication, MedicationFormData } from './medicationTypes'

export const EMPTY_MEDICATION_FORM: MedicationFormData = {
  commercialName: '',
  activeIngredient: '',
  indications: '',
  dosage: '',
  doseMgKg: 0,
  frequency: 'SID (uma vez ao dia)',
  route: 'Oral',
  concentration: '',
  concentrationMgMl: null,
  contraindications: '',
  notes: '',
}

const splitList = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

const isMgPerMl = (unit: string) => unit.toLocaleLowerCase('pt-BR').replaceAll(' ', '') === 'mg/ml'

function splitMeasurement(measurement: string) {
  const match = measurement.trim().match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/)
  return {
    value: match ? Number(match[1].replace(',', '.')) : Number.NaN,
    unit: match?.[2].trim() ?? '',
  }
}

export function medicamentoToMedication(medicamento: Medicamento): Medication {
  const dosageValue = splitMeasurement(medicamento.tipo).value
  return {
    id: medicamento.id,
    commercialName: medicamento.nome,
    activeIngredient: medicamento.principioAtivo,
    indications: [],
    dosage: medicamento.tipo,
    doseMgKg: Number.isFinite(dosageValue) ? dosageValue : 0,
    frequency: medicamento.formaFarmaceutica,
    route: medicamento.viaAdministracao,
    concentration: `${medicamento.concentracao} ${medicamento.unidadeConcentracao}`.trim(),
    concentrationMgMl: isMgPerMl(medicamento.unidadeConcentracao) ? medicamento.concentracao : null,
    contraindications: [],
    notes: medicamento.descricao,
  }
}

export function buildMedication(
  form: MedicationFormData,
  id: number,
): { error: string } | { medicamento: Medicamento; medication: Medication } {
  const parsed = splitMeasurement(form.concentration)
  const value = form.concentrationMgMl ?? parsed.value
  const unit = parsed.unit || (form.concentrationMgMl ? 'mg/mL' : '')
  if (!Number.isFinite(value) || value <= 0 || !unit)
    return { error: 'Informe a concentração com valor e unidade, por exemplo: 30 mg/mL.' }

  const medicamento = new Medicamento(
    id,
    form.commercialName.trim(),
    form.activeIngredient.trim(),
    form.notes.trim(),
    value,
    unit,
    form.frequency.trim(),
    form.route.trim(),
    form.dosage.trim(),
  )
  const medication: Medication = {
    ...form,
    id,
    indications: splitList(form.indications),
    contraindications: splitList(form.contraindications),
    concentration: `${value} ${unit}`,
    concentrationMgMl: isMgPerMl(unit) ? value : null,
  }
  return { medicamento, medication }
}
