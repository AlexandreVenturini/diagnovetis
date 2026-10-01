import { describe, expect, it } from 'vitest'
import {
  noIntervalo,
  mesclarIntervalos,
  intervalosFaltando,
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

  it('junta intervalos vizinhos e sobrepostos', () => {
    expect(
      mesclarIntervalos([
        { inicio: '2026-09-08', fim: '2026-09-14' },
        { inicio: '2026-09-01', fim: '2026-09-07' },
        { inicio: '2026-09-20', fim: '2026-09-30' },
      ]),
    ).toEqual([
      { inicio: '2026-09-01', fim: '2026-09-14' },
      { inicio: '2026-09-20', fim: '2026-09-30' },
    ])
  })

  it('busca só os dias que ainda não foram carregados', () => {
    const semana = { inicio: '2026-09-28', fim: '2026-10-04' }
    expect(intervalosFaltando([], semana)).toEqual([semana])
    expect(intervalosFaltando([semana], { inicio: '2026-09-01', fim: '2026-10-31' })).toEqual([
      { inicio: '2026-09-01', fim: '2026-09-27' },
      { inicio: '2026-10-05', fim: '2026-10-31' },
    ])
    expect(intervalosFaltando([{ inicio: '2026-01-01', fim: '2026-12-31' }], semana)).toEqual([])
  })

  it('confere se uma data está no período', () => {
    expect(noIntervalo('2026-09-28', { inicio: '2026-09-01', fim: '2026-09-30' })).toBe(true)
    expect(noIntervalo('2026-10-01', { inicio: '2026-09-01', fim: '2026-09-30' })).toBe(false)
    expect(noIntervalo('', null)).toBe(true)
  })
})
