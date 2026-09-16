import { describe, expect, it } from 'vitest'
import { applyDoseToPrescription } from '../features/prescriptions/applyDose'
import { filterAnimals } from '../features/prescriptions/filterAnimals'
import { emptyPrescription, emptyPrescriptionItem } from '../features/consultations/prescriptionReport'

const prescription = { ...emptyPrescription(), items: [{ ...emptyPrescriptionItem(), medication: 'Primeiro', dose: 'Manter' }, { ...emptyPrescriptionItem(), medication: 'Segundo' }] }
describe('Aplicar dose no receituário', () => {
  it('preenche somente a dose do medicamento selecionado, aceitando vírgula decimal', () => {
    const result = applyDoseToPrescription(prescription, 1, '2,5', '3', '5')
    expect(result.error).toBe('')
    expect(result.prescription.items[1].dose).toBe('1,5 mL (7,5 mg) por administração')
    expect(result.prescription.items[0].dose).toBe('Manter')
    expect(prescription.items[1].dose).toBe('')
  })
  it('informa os campos ausentes sem alterar a receita', () => {
    const result = applyDoseToPrescription(emptyPrescription(), 0, '', '', '')
    expect(result.error).toContain('medicamento')
    expect(result.error).toContain('peso')
    expect(result.error).toContain('mg/kg')
    expect(result.error).toContain('mg/mL')
    expect(result.prescription.items[0].dose).toBe('')
  })
  it('recusa concentração zero e índice removido', () => {
    expect(applyDoseToPrescription(prescription, 1, '10', '1', '0').error).not.toBe('')
    expect(applyDoseToPrescription(prescription, 99, '10', '1', '1').error).not.toBe('')
  })
})
describe('Busca de animais', () => {
  const dogs = [{ id: 12, name: 'Belinha', tutor: 'Márcia', breed: '', age: '', sex: '', weight: '', contact: '', history: '' }, { id: 13, name: 'Belinha', tutor: 'João', breed: '', age: '', sex: '', weight: '', contact: '', history: '' }]
  it('não mostra a lista sem busca e encontra por tutor sem acento e identificação', () => {
    expect(filterAnimals(dogs, '')).toEqual([])
    expect(filterAnimals(dogs, '   ')).toEqual([])
    expect(filterAnimals(dogs, 'marcia').map(dog => dog.id)).toEqual([12])
    expect(filterAnimals(dogs, '#13').map(dog => dog.id)).toEqual([13])
    expect(filterAnimals(dogs, 'beli')).toHaveLength(2)
    expect(filterAnimals(dogs, 'inexistente')).toEqual([])
  })
})
