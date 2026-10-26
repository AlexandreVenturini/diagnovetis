import { describe, expect, it, vi } from 'vitest'
import { criarClienteConsultas } from '../features/shared/consultas'
import { blocosDoPeriodo, chaveDoBloco, intervaloPeriodo, type Intervalo } from '../features/shared/periodo'
import { combinarBlocos } from '../features/shared/useDadosPorPeriodo'

type Item = { id: number; data: string }

const resultado = (data: Item[] | undefined, extra: Partial<Parameters<typeof combinarBlocos<Item>>[0][0]> = {}) => ({
  data,
  error: null,
  isPending: data === undefined,
  isFetching: false,
  dataUpdatedAt: data ? 1000 : 0,
  ...extra,
})

describe('Carregamento por período com cache', () => {
  it('busca só os meses que faltam e não busca de novo o que já carregou', async () => {
    const cliente = criarClienteConsultas()
    const buscador = vi.fn(async (bloco: Intervalo | null) => [{ id: 1, data: bloco?.inicio ?? 'tudo' }])
    const abrir = (visao: 'mes' | 'ano') =>
      Promise.all(
        blocosDoPeriodo(intervaloPeriodo({ visao, data: '2026-09-28' }), false).map((bloco) =>
          cliente.fetchQuery({ queryKey: ['teste', chaveDoBloco(bloco)], queryFn: () => buscador(bloco) }),
        ),
      )

    await abrir('mes')
    expect(buscador).toHaveBeenCalledTimes(1)
    await abrir('ano')
    expect(buscador).toHaveBeenCalledTimes(12)
    await abrir('mes')
    expect(buscador).toHaveBeenCalledTimes(12)
  })

  it('junta os meses sem repetir itens e informa carregamento, erro e horário', () => {
    const chave = (item: Item) => item.id
    const junto = combinarBlocos(
      [
        resultado([{ id: 1, data: '2026-09-30' }]),
        resultado(
          [
            { id: 1, data: '2026-09-30' },
            { id: 2, data: '2026-10-01' },
          ],
          { dataUpdatedAt: 2000 },
        ),
      ],
      chave,
    )
    expect(junto.itens.map((item) => item.id)).toEqual([1, 2])
    expect(junto.carregando).toBe(false)
    expect(junto.atualizadoEm?.getTime()).toBe(2000)

    const pendente = combinarBlocos([resultado([{ id: 1, data: '2026-09-30' }]), resultado(undefined)], chave)
    expect(pendente.carregando).toBe(true)

    const falhou = combinarBlocos([resultado(undefined, { error: new Error('Sem conexão'), isPending: false })], chave)
    expect(falhou.erro).toBe('Sem conexão')
    expect(falhou.atualizadoEm).toBeNull()
  })
})
