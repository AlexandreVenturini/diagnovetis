import { useCallback, useEffect, useRef, useState } from 'react'
import { marcarCarregado, intervalosParaBuscar } from './periodo'
import type { Intervalo, CacheIntervalos } from './periodo'

export function useDadosPorIntervalo<T>(
  buscador: (intervalo: Intervalo | null) => Promise<T[]>,
  obterChave: (item: T) => string | number,
  intervalo: Intervalo | null,
) {
  const [itens, setItens] = useState<T[]>([])
  const [chaveCarregada, setChaveCarregada] = useState('')
  const [erro, setErro] = useState('')
  const [versao, setVersao] = useState(0)
  const cache = useRef<CacheIntervalos>({ todos: false, intervalos: [] })
  const buscadorRef = useRef(buscador)
  const obterChaveRef = useRef(obterChave)

  useEffect(() => {
    buscadorRef.current = buscador
    obterChaveRef.current = obterChave
  })

  const chaveIntervalo = intervalo ? `${intervalo.inicio}|${intervalo.fim}` : 'tudo'
  const chaveRequisicao = `${chaveIntervalo}#${versao}`

  const mesclar = useCallback((resultados: T[]) => {
    setItens((atual) => {
      const porChave = new Map(atual.map((item) => [obterChaveRef.current(item), item]))
      for (const item of resultados) porChave.set(obterChaveRef.current(item), item)
      return [...porChave.values()]
    })
  }, [])

  useEffect(() => {
    let ativo = true
    const alvo =
      chaveIntervalo === 'tudo' ? null : { inicio: chaveIntervalo.split('|')[0], fim: chaveIntervalo.split('|')[1] }
    const lacunas = intervalosParaBuscar(cache.current, alvo)

    Promise.all(lacunas.map((lacuna) => buscadorRef.current(lacuna)))
      .then((resultados) => {
        if (!ativo) return
        cache.current = marcarCarregado(cache.current, alvo)
        mesclar(resultados.flat())
        setErro('')
        setChaveCarregada(chaveRequisicao)
      })
      .catch((falha: Error) => {
        if (!ativo) return
        setErro(falha.message || 'Não foi possível carregar os dados.')
        setChaveCarregada(chaveRequisicao)
      })

    return () => {
      ativo = false
    }
  }, [chaveIntervalo, chaveRequisicao, mesclar])

  const recarregar = useCallback(async () => {
    const alvo =
      chaveIntervalo === 'tudo' ? null : { inicio: chaveIntervalo.split('|')[0], fim: chaveIntervalo.split('|')[1] }
    mesclar(await buscadorRef.current(alvo))
  }, [chaveIntervalo, mesclar])

  const reiniciar = useCallback(() => {
    cache.current = { todos: false, intervalos: [] }
    setItens([])
    setVersao((valor) => valor + 1)
  }, [])

  return {
    itens,
    carregando: chaveCarregada !== chaveRequisicao,
    erro,
    recarregar,
    reiniciar,
    inserirOuAtualizar: mesclar,
  }
}
