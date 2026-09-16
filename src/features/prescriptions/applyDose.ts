import type { Prescription } from '../consultations/prescriptionReport'
import { calculateDose } from './doseCalculation'

export function decimalValue(value: string) {
  const normalized = value.trim().replace(',', '.')
  return /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized) ? Number(normalized) : NaN
}
const format = (value: number) => value.toLocaleString('pt-BR', { maximumSignificantDigits: 8 })
export function applyDoseToPrescription(prescription: Prescription, index: number, weight: string, mgKg: string, concentration: string) {
  const missing: string[] = []
  if (!prescription.items[index]?.medication.trim()) missing.push('adicione um medicamento na busca ou preencha o nome na receita')
  if (!(decimalValue(weight) > 0)) missing.push('informe o peso do animal em kg')
  if (!(decimalValue(mgKg) > 0)) missing.push('informe a dose em mg/kg por administração')
  if (!(decimalValue(concentration) > 0)) missing.push('informe a concentração em mg/mL')
  if (missing.length) return { error: `Para aplicar a dose: ${missing.join('; ')}.`, prescription }
  const calculation = calculateDose(decimalValue(weight), decimalValue(mgKg), decimalValue(concentration))
  if (!calculation) return { error: 'Os valores informados não permitem um cálculo válido. Confira peso, dose e concentração.', prescription }
  const dose = `${format(calculation.ml)} mL (${format(calculation.mg)} mg) por administração`
  return { error: '', dose, prescription: { ...prescription, items: prescription.items.map((item, i) => i === index ? { ...item, dose } : item) } }
}
