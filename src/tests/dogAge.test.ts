import { describe, expect, it } from 'vitest'
import { formatDogAge, parseDogAge, serializeDogAge } from '../features/dogs/dogAge'

describe('Idade do cão em anos e meses', () => {
  it.each([
    ['0', '6', '6 meses'],
    ['2', '3', '2 anos e 3 meses'],
    ['1', '1', '1 ano e 1 mês'],
    ['4', '0', '4 anos'],
    ['0', '0', '0 meses'],
  ])('salva e recupera %s anos e %s meses', (years, months, text) => {
    expect(serializeDogAge(years, months)).toBe(text)
    expect(parseDogAge(text)).toEqual({ years, months })
    expect(formatDogAge(text)).toBe(text)
  })

  it('permite preencher somente anos ou somente meses', () => {
    expect(serializeDogAge('', '6')).toBe('6 meses')
    expect(serializeDogAge('2', '')).toBe('2 anos')
  })

  it('mantém compatibilidade com cadastros antigos', () => {
    expect(parseDogAge('3')).toEqual({ years: '3', months: '0' })
    expect(formatDogAge('3')).toBe('3 anos')
    expect(parseDogAge('3 anos')).toEqual({ years: '3', months: '0' })
    expect(parseDogAge('')).toEqual({ years: '', months: '' })
  })

  it.each([['', ''], ['-1', '0'], ['1.5', '0'], ['0', '-1'], ['0', '12'], ['0', '1.5']])('rejeita idade inválida: %s anos e %s meses', (years, months) => {
    expect(() => serializeDogAge(years, months)).toThrow()
  })
})
