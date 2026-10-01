import { describe, expect, it } from 'vitest'
import { calcularDose } from '../features/receitas/nova/calculoDose'

describe('Conversão aritmética de dose', () => {
  it('converte mg/kg em mg e mL por administração sem arredondamento intermediário', () => {
    expect(calcularDose(2.5, 3, 5)).toEqual({ mg: 7.5, ml: 1.5 })
    expect(calcularDose(0.4, 0.2, 10)).toEqual({ mg: 0.08000000000000002, ml: 0.008000000000000002 })
  })
  it('recusa valores ausentes, negativos, infinitos e divisão por zero', () => {
    for (const valor of [0, -1, NaN, Infinity]) {
      expect(calcularDose(valor, 1, 1)).toBeNull()
      expect(calcularDose(1, valor, 1)).toBeNull()
      expect(calcularDose(1, 1, valor)).toBeNull()
    }
    expect(calcularDose(Number.MAX_VALUE, 2, 1)).toBeNull()
  })
})
