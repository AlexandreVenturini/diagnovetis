import { describe, expect, it } from 'vitest'
import {
  noIntervalo,
  mesesDoIntervalo,
  limitesPeriodo,
  rotuloPeriodo,
  intervaloPeriodo,
  deslocarPeriodo,
} from '../features/shared/periodo'

describe('Filtro de período padrão', () => {
  it('calcula dia, semana, mês e ano', () => {
    expect(limitesPeriodo('2026-09-28', 'dia')).toEqual({ inicio: '2026-09-28', fim: '2026-09-28' })
    expect(limitesPeriodo('2026-09-28', 'semana')).toEqual({ inicio: '2026-09-28', fim: '2026-10-04' })
    expect(limitesPeriodo('2026-02-10', 'mes')).toEqual({ inicio: '2026-02-01', fim: '2026-02-28' })
    expect(limitesPeriodo('2026-09-28', 'ano')).toEqual({ inicio: '2026-01-01', fim: '2026-12-31' })
    expect(intervaloPeriodo({ visao: 'tudo', data: '2026-09-28' })).toBeNull()
  })

  it('navega entre anos e mostra o rótulo de todo o período', () => {
    expect(deslocarPeriodo('2026-09-28', 'ano', -1)).toBe('2025-01-01')
    expect(rotuloPeriodo('2026-09-28', 'ano')).toBe('2026')
    expect(rotuloPeriodo('2026-09-28', 'tudo')).toBe('Todo o período')
  })

  it('divide o período em meses inteiros', () => {
    expect(mesesDoIntervalo({ inicio: '2026-09-28', fim: '2026-10-04' })).toEqual([
      { inicio: '2026-09-01', fim: '2026-09-30' },
      { inicio: '2026-10-01', fim: '2026-10-31' },
    ])
    expect(mesesDoIntervalo({ inicio: '2024-02-10', fim: '2024-02-10' })).toEqual([
      { inicio: '2024-02-01', fim: '2024-02-29' },
    ])
    expect(mesesDoIntervalo({ inicio: '2025-12-01', fim: '2026-01-31' }).map((mes) => mes.inicio)).toEqual([
      '2025-12-01',
      '2026-01-01',
    ])
    expect(mesesDoIntervalo({ inicio: '2026-01-01', fim: '2026-12-31' })).toHaveLength(12)
  })

  it('confere se uma data está no período', () => {
    expect(noIntervalo('2026-09-28', { inicio: '2026-09-01', fim: '2026-09-30' })).toBe(true)
    expect(noIntervalo('2026-10-01', { inicio: '2026-09-01', fim: '2026-09-30' })).toBe(false)
    expect(noIntervalo('', null)).toBe(true)
  })
})
