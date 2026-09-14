import type { ConsultationData } from './consultationTypes'
import { formatDogAge } from '../dogs/dogAge'

export type PrescriptionItem = {
  medication: string; dose: string; route: string; frequency: string; duration: string; quantity: string
}
export type Prescription = { crmv: string; instructions: string; items: PrescriptionItem[] }
export const emptyPrescriptionItem = (): PrescriptionItem => ({ medication: '', dose: '', route: '', frequency: '', duration: '', quantity: '' })
export const emptyPrescription = (): Prescription => ({ crmv: '', instructions: '', items: [emptyPrescriptionItem()] })

export function hasPrescription(prescription: Prescription): boolean {
  return Boolean(prescription.crmv.trim() || prescription.instructions.trim() || prescription.items.some((item) => Object.values(item).some((value) => value.trim())))
}

export function validatePrescription(data: ConsultationData, prescription: Prescription): string {
  if (![data.dogName, data.tutorName, data.veterinarian].every((value) => value.trim())) return 'Preencha o paciente, o tutor e o veterinário na etapa de identificação.'
  if (!prescription.crmv.trim()) return 'Informe o CRMV e a UF do veterinário.'
  if (!prescription.items.length || prescription.items.some((item) => Object.values(item).some((value) => !value.trim()))) return 'Preencha medicamento, dose, via, frequência, duração e quantidade de todos os itens.'
  return ''
}

function escape(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;')
}

export function prescriptionHtml(data: ConsultationData, prescription: Prescription, issuedAt = new Date()): string {
  const error = validatePrescription(data, prescription)
  if (error) throw new Error(error)
  const field = (label: string, value: string) => `<div><span>${label}</span><strong>${escape(value.trim() || 'Não informado')}</strong></div>`
  return `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Receita - ${escape(data.dogName)}</title>
  <style>
  *{box-sizing:border-box}body{margin:0;background:#edf2ee;color:#203529;font:14px/1.5 Arial,sans-serif}.page{max-width:210mm;margin:24px auto;padding:18mm;background:white}header{border-bottom:3px solid #287642;padding-bottom:18px}h1{margin:0;color:#176534;font-size:26px}header p{margin:4px 0}h2{font-size:20px;margin:22px 0 14px}.patient{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:16px;background:#f3f7f4}.patient span{display:block;font-size:11px;color:#526757}.patient strong{display:block;overflow-wrap:anywhere}.item{padding:18px 0;border-bottom:1px solid #cedbd1;break-inside:avoid}.item h3{margin:0 0 8px;font-size:16px;overflow-wrap:anywhere}.item p{margin:4px 0;white-space:pre-wrap;overflow-wrap:anywhere}.instructions{white-space:pre-wrap;overflow-wrap:anywhere}.signature{margin:65px auto 0;padding-top:10px;border-top:1px solid #506454;text-align:center;max-width:360px;break-inside:avoid}.signature p{margin:3px}footer{margin-top:30px;font-size:11px;color:#526757}.actions{display:flex;justify-content:center;gap:12px;padding:15px}.actions button{padding:12px 18px;border:0;border-radius:8px;background:#287642;color:white;cursor:pointer}@page{size:A4;margin:16mm}@media print{body{background:white}.page{max-width:none;margin:0;padding:0}.actions{display:none}}@media(max-width:600px){.page{margin:0;padding:22px}.patient{grid-template-columns:1fr}}
  </style></head><body><main class="page"><header><h1>DiagnoVetis</h1><p>IFES Santa Teresa · Sistema de Gestão Veterinária</p></header><h2>Receita veterinária</h2><p>Data: ${escape(issuedAt.toLocaleDateString('pt-BR'))}</p><section class="patient">${field('Paciente', data.dogName)}${field('Tutor', data.tutorName)}${field('Espécie', 'Canina')}${field('Raça', data.breed)}${field('Idade', formatDogAge(data.age))}${field('Veterinário', data.veterinarian)}</section>
  ${prescription.items.map((item, index) => `<section class="item"><h3>${index + 1}. ${escape(item.medication)}</h3><p><b>Dose:</b> ${escape(item.dose)}</p><p><b>Via:</b> ${escape(item.route)} · <b>Frequência:</b> ${escape(item.frequency)}</p><p><b>Duração:</b> ${escape(item.duration)}</p><p><b>Quantidade a dispensar:</b> ${escape(item.quantity)}</p></section>`).join('')}
  ${prescription.instructions.trim() ? `<h2>Orientações ao tutor</h2><p class="instructions">${escape(prescription.instructions)}</p>` : ''}
  <div class="signature"><p><b>${escape(data.veterinarian)}</b></p><p>CRMV: ${escape(prescription.crmv)}</p><p>Assinatura do médico-veterinário</p></div><footer>DiagnoVetis · Receita preenchida pelo profissional responsável.</footer></main><div class="actions"><button onclick="window.print()">Imprimir / Salvar PDF</button><button onclick="window.close()">Fechar</button></div></body></html>`
}

export function generatePrescription(data: ConsultationData, prescription: Prescription, issuedAt = new Date()): boolean {
  const html = prescriptionHtml(data, prescription, issuedAt)
  const popup = window.open('', '_blank', 'width=900,height=800')
  if (!popup) return false
  popup.document.open()
  popup.document.write(html)
  popup.document.close()
  return true
}
