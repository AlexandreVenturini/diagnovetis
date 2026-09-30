import type { ConsultationData } from '../consultations/consultationTypes'
import { formatDogAge } from '../dogs/dogAge'
import prescriptionPrintCss from './print/prescription-print.css?raw'

export type PrescriptionItem = {
  medication: string
  dose: string
  route: string
  frequency: string
  duration: string
  quantity: string
}
export type Prescription = { crmv: string; instructions: string; items: PrescriptionItem[] }
export const emptyPrescriptionItem = (): PrescriptionItem => ({
  medication: '',
  dose: '',
  route: '',
  frequency: '',
  duration: '',
  quantity: '',
})
export const emptyPrescription = (): Prescription => ({ crmv: '', instructions: '', items: [emptyPrescriptionItem()] })

export function hasPrescription(prescription: Prescription): boolean {
  return Boolean(
    prescription.crmv.trim() ||
    prescription.instructions.trim() ||
    prescription.items.some((item) => Object.values(item).some((value) => value.trim())),
  )
}

export function validatePrescription(data: ConsultationData, prescription: Prescription): string {
  if (![data.dogName, data.tutorName, data.veterinarian].every((value) => value.trim()))
    return 'Preencha o paciente, o tutor e o veterinário na etapa de identificação.'
  if (!prescription.crmv.trim()) return 'Informe o CRMV e a UF do veterinário.'
  if (
    !prescription.items.length ||
    prescription.items.some((item) => Object.values(item).some((value) => !value.trim()))
  )
    return 'Preencha medicamento, dose, via, frequência, duração e quantidade de todos os itens.'
  return ''
}

function escape(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export function prescriptionHtml(data: ConsultationData, prescription: Prescription, issuedAt = new Date()): string {
  const error = validatePrescription(data, prescription)
  if (error) throw new Error(error)
  const field = (label: string, value: string) =>
    `<div><span>${label}</span><strong>${escape(value.trim() || 'Não informado')}</strong></div>`
  const item = (medication: PrescriptionItem, index: number) => `
      <section class="item">
        <h3>${index + 1}. ${escape(medication.medication)}</h3>
        <p><b>Dose:</b> ${escape(medication.dose)}</p>
        <p><b>Via:</b> ${escape(medication.route)} · <b>Frequência:</b> ${escape(medication.frequency)}</p>
        <p><b>Duração:</b> ${escape(medication.duration)}</p>
        <p><b>Quantidade a dispensar:</b> ${escape(medication.quantity)}</p>
      </section>`
  const instructions = prescription.instructions.trim()
    ? `<h2>Orientações ao tutor</h2>
      <p class="instructions">${escape(prescription.instructions)}</p>`
    : ''

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Receita - ${escape(data.dogName)}</title>
    <style>${prescriptionPrintCss}</style>
  </head>
  <body>
    <main class="page">
      <header>
        <h1>DiagnoVetis</h1>
        <p>IFES Santa Teresa · Sistema de Gestão Veterinária</p>
      </header>
      <h2>Receita veterinária</h2>
      <p>Data: ${escape(issuedAt.toLocaleDateString('pt-BR'))}</p>
      <section class="patient">
        ${field('Paciente', data.dogName)}
        ${field('Tutor', data.tutorName)}
        ${field('Espécie', 'Canina')}
        ${field('Raça', data.breed)}
        ${field('Peso (kg)', data.weight || '')}
        ${field('Identificação', data.patientId || '')}
        ${field('Idade', formatDogAge(data.age))}
        ${field('Veterinário', data.veterinarian)}
      </section>
      ${prescription.items.map(item).join('')}
      ${instructions}
      <div class="signature">
        <p><b>${escape(data.veterinarian)}</b></p>
        <p>CRMV: ${escape(prescription.crmv)}</p>
        <p>Assinatura do médico-veterinário</p>
      </div>
      <footer>DiagnoVetis · Receita preenchida pelo profissional responsável.</footer>
    </main>
    <div class="actions">
      <button onclick="window.print()">Imprimir / Salvar PDF</button>
      <button onclick="window.close()">Fechar</button>
    </div>
  </body>
</html>`
}

export function generatePrescription(
  data: ConsultationData,
  prescription: Prescription,
  issuedAt = new Date(),
): boolean {
  const html = prescriptionHtml(data, prescription, issuedAt)
  const popup = window.open('', '_blank', 'width=900,height=800')
  if (!popup) return false
  popup.document.open()
  popup.document.write(html)
  popup.document.close()
  return true
}
