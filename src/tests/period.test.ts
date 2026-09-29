import { describe, expect, it } from 'vitest'
import {
  inRange,
  mergeRanges,
  missingRanges,
  periodBounds,
  periodLabel,
  periodRange,
  shiftPeriod,
} from '../features/common/period'

describe('Filtro de período padrão', () => {
  it('calcula dia, semana, mês e ano', () => {
    expect(periodBounds('2026-09-28', 'day')).toEqual({ start: '2026-09-28', end: '2026-09-28' })
    expect(periodBounds('2026-09-28', 'week')).toEqual({ start: '2026-09-28', end: '2026-10-04' })
    expect(periodBounds('2026-02-10', 'month')).toEqual({ start: '2026-02-01', end: '2026-02-28' })
    expect(periodBounds('2026-09-28', 'year')).toEqual({ start: '2026-01-01', end: '2026-12-31' })
    expect(periodRange({ view: 'all', date: '2026-09-28' })).toBeNull()
  })

  it('navega entre anos e mostra o rótulo de todo o período', () => {
    expect(shiftPeriod('2026-09-28', 'year', -1)).toBe('2025-01-01')
    expect(periodLabel('2026-09-28', 'year')).toBe('2026')
    expect(periodLabel('2026-09-28', 'all')).toBe('Todo o período')
  })

  it('junta intervalos vizinhos e sobrepostos', () => {
    expect(
      mergeRanges([
        { start: '2026-09-08', end: '2026-09-14' },
        { start: '2026-09-01', end: '2026-09-07' },
        { start: '2026-09-20', end: '2026-09-30' },
      ]),
    ).toEqual([
      { start: '2026-09-01', end: '2026-09-14' },
      { start: '2026-09-20', end: '2026-09-30' },
    ])
  })

  it('busca só os dias que ainda não foram carregados', () => {
    const semana = { start: '2026-09-28', end: '2026-10-04' }
    expect(missingRanges([], semana)).toEqual([semana])
    expect(missingRanges([semana], { start: '2026-09-01', end: '2026-10-31' })).toEqual([
      { start: '2026-09-01', end: '2026-09-27' },
      { start: '2026-10-05', end: '2026-10-31' },
    ])
    expect(missingRanges([{ start: '2026-01-01', end: '2026-12-31' }], semana)).toEqual([])
  })

  it('confere se uma data está no período', () => {
    expect(inRange('2026-09-28', { start: '2026-09-01', end: '2026-09-30' })).toBe(true)
    expect(inRange('2026-10-01', { start: '2026-09-01', end: '2026-09-30' })).toBe(false)
    expect(inRange('', null)).toBe(true)
  })
})
