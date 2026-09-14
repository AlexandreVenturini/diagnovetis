import { describe, expect, it, vi } from 'vitest'
import { EMPTY_CONSULTATION } from '../features/consultations/consultationTypes'
import { emptyPrescription, generatePrescription, hasPrescription, prescriptionHtml, validatePrescription } from '../features/consultations/prescriptionReport'

const patient = { ...EMPTY_CONSULTATION, dogName: 'Paciente teste', tutorName: 'Tutor teste', veterinarian: 'Profissional teste', age: '2', breed: 'Poodle' }
const prescription = { crmv: '123 / ES', instructions: 'Orientação de teste\nSegunda linha', items: [{ medication: 'Medicamento de teste', dose: 'Dose informada', route: 'Via informada', frequency: 'Intervalo informado', duration: 'Duração informada', quantity: 'Quantidade informada' }] }

describe('Receita veterinária', () => {
  it('distingue atendimento sem receita de uma prescrição parcialmente preenchida', () => {
    expect(hasPrescription(emptyPrescription())).toBe(false)
    expect(hasPrescription({ ...emptyPrescription(), instructions: 'Orientação' })).toBe(true)
    expect(hasPrescription(prescription)).toBe(true)
  })
  it('exige identificação, CRMV e todos os campos dos medicamentos', () => {
    expect(validatePrescription(EMPTY_CONSULTATION, prescription)).not.toBe('')
    expect(validatePrescription(patient, emptyPrescription())).not.toBe('')
    expect(validatePrescription(patient, { ...prescription, items: [] })).not.toBe('')
    for (const key of Object.keys(prescription.items[0])) {
      expect(validatePrescription(patient, { ...prescription, items: [{ ...prescription.items[0], [key]: ' ' }] })).not.toBe('')
    }
    expect(validatePrescription(patient, prescription)).toBe('')
  })

  it('gera os dados da receita, unidades de idade e múltiplos medicamentos', () => {
    const html = prescriptionHtml(patient, { ...prescription, items: [...prescription.items, { ...prescription.items[0], medication: 'Outro medicamento' }] }, new Date(2026, 8, 14, 12))
    for (const value of ['Paciente teste', 'Tutor teste', 'Profissional teste', '2 anos', '123 / ES', '14/09/2026', '2. Outro medicamento', ...Object.values(prescription.items[0])]) expect(html).toContain(value)
    expect(html).toContain('@media print')
  })

  it('escapa conteúdo digitado para impedir execução de HTML no documento', () => {
    const html = prescriptionHtml({ ...patient, dogName: '<script>alert(1)</script>' }, { ...prescription, instructions: '<img src=x onerror=alert(1)>' })
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;script&gt;')
  })

  it('informa quando a janela está bloqueada e escreve o documento quando permitida', () => {
    const popup = { document: { open: vi.fn(), write: vi.fn(), close: vi.fn() } }
    const open = vi.fn().mockReturnValueOnce(null).mockReturnValueOnce(popup)
    vi.stubGlobal('window', { open })
    try {
      expect(generatePrescription(patient, prescription)).toBe(false)
      expect(generatePrescription(patient, prescription)).toBe(true)
      expect(popup.document.write).toHaveBeenCalledWith(expect.stringContaining('Receita veterinária'))
      expect(popup.document.close).toHaveBeenCalled()
    } finally { vi.unstubAllGlobals() }
  })
})
