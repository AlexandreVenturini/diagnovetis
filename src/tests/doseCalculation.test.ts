import { describe, expect, it } from 'vitest'
import { calculateDose } from '../features/prescriptions/doseCalculation'

describe('Conversão aritmética de dose', () => {
  it('converte mg/kg em mg e mL por administração sem arredondamento intermediário', () => {
    expect(calculateDose(2.5, 3, 5)).toEqual({ mg: 7.5, ml: 1.5 })
    expect(calculateDose(0.4, 0.2, 10)).toEqual({ mg: 0.08000000000000002, ml: 0.008000000000000002 })
  })
  it('recusa valores ausentes, negativos, infinitos e divisão por zero', () => {
    for (const value of [0, -1, NaN, Infinity]) {
      expect(calculateDose(value, 1, 1)).toBeNull()
      expect(calculateDose(1, value, 1)).toBeNull()
      expect(calculateDose(1, 1, value)).toBeNull()
    }
    expect(calculateDose(Number.MAX_VALUE, 2, 1)).toBeNull()
  })
})
