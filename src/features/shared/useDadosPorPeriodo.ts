import { useCallback } from 'react'
import { useQueries, useQueryClient, type UseQueryResult } from '@tanstack/react-query'
import { blocosDoPeriodo, chaveDoBloco, type Intervalo } from './periodo'

type Chave = string | number
type ResultadoBloco<T> = Pick<UseQueryResult<T[]>, 'data' | 'error' | 'isPending' | 'isFetching' | 'dataUpdatedAt'>

export function combinarBlocos<T>(resultados: ResultadoBloco<T>[], obterChave: (item: T) => Chave) {
  const porChave = new Map<Chave, T>()
  for (const resultado of resultados) for (const item of resultado.data ?? []) porChave.set(obterChave(item), item)
  const falha = resultados.find((resultado) => resultado.error)?.error
  const atualizacoes = resultados.map((resultado) => resultado.dataUpdatedAt).filter(Boolean)
  return {
    itens: [...porChave.values()],
    carregando: resultados.some((resultado) => resultado.isPending),
    atualizando: resultados.some((resultado) => resultado.isFetching),
    erro: falha ? falha.message || 'Não foi possível carregar os dados.' : '',
    atualizadoEm: atualizacoes.length ? new Date(Math.max(...atualizacoes)) : null,
  }
}

export function useDadosPorPeriodo<T>(
  recurso: readonly string[],
  buscador: (intervalo: Intervalo | null) => Promise<T[]>,
  obterChave: (item: T) => Chave,
  intervalo: Intervalo | null,
) {
  const cliente = useQueryClient()
  const tudoCarregado = cliente.getQueryData([...recurso, 'tudo']) !== undefined
  const blocos = blocosDoPeriodo(intervalo, tudoCarregado)

  const combinar = useCallback(
    (resultados: UseQueryResult<T[]>[]) => combinarBlocos(resultados, obterChave),
    [obterChave],
  )

  const dados = useQueries({
    queries: blocos.map((bloco) => ({
      queryKey: [...recurso, chaveDoBloco(bloco)],
      queryFn: () => buscador(bloco),
    })),
    combine: combinar,
  })

  const recarregar = useCallback(() => cliente.invalidateQueries({ queryKey: recurso }), [cliente, recurso])

  const inserirOuAtualizar = useCallback(
    (novos: T[]) => {
      const chavesNovas = new Set(novos.map(obterChave))
      cliente.setQueriesData<T[]>({ queryKey: recurso }, (atual) =>
        atual ? [...atual.filter((item) => !chavesNovas.has(obterChave(item))), ...novos] : atual,
      )
      void cliente.invalidateQueries({ queryKey: recurso })
    },
    [cliente, recurso, obterChave],
  )

  return { ...dados, recarregar, inserirOuAtualizar }
}
