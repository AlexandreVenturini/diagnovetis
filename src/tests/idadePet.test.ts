import { describe, expect, it } from 'vitest'
import { formatarIdadePet, interpretarIdadePet, serializarIdadePet } from '../features/pets/idadePet'

describe('Idade do cão em anos e meses', () => {
  it.each([
    ['0', '6', '6 meses'],
    ['2', '3', '2 anos e 3 meses'],
    ['1', '1', '1 ano e 1 mês'],
    ['4', '0', '4 anos'],
    ['0', '0', '0 meses'],
  ])('salva e recupera %s anos e %s meses', (anos, meses, texto) => {
    expect(serializarIdadePet(anos, meses)).toBe(texto)
    expect(interpretarIdadePet(texto)).toEqual({ anos, meses })
    expect(formatarIdadePet(texto)).toBe(texto)
  })

  it('permite preencher somente anos ou somente meses', () => {
    expect(serializarIdadePet('', '6')).toBe('6 meses')
    expect(serializarIdadePet('2', '')).toBe('2 anos')
  })

  it('mantém compatibilidade com cadastros antigos', () => {
    expect(interpretarIdadePet('3')).toEqual({ anos: '3', meses: '0' })
    expect(formatarIdadePet('3')).toBe('3 anos')
    expect(interpretarIdadePet('3 anos')).toEqual({ anos: '3', meses: '0' })
    expect(interpretarIdadePet('')).toEqual({ anos: '', meses: '' })
  })

  it.each([
    ['', ''],
    ['-1', '0'],
    ['1.5', '0'],
    ['0', '-1'],
    ['0', '12'],
    ['0', '1.5'],
  ])('rejeita idade inválida: %s anos e %s meses', (anos, meses) => {
    expect(() => serializarIdadePet(anos, meses)).toThrow()
  })
})
