import { useCallback, useEffect, useState } from 'react'
import type { AtendimentoEmAndamento } from '../../services/ConsultaService'
import { listarEmAndamento } from './salvarAtendimento'

export function useAtendimentosEmAndamento() {
  const [itens, setItens] = useState<AtendimentoEmAndamento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const recarregar = useCallback(async () => {
    try {
      setItens(await listarEmAndamento())
      setErro('')
    } catch (falha) {
      setErro((falha as Error).message)
    }
  }, [])

  useEffect(() => {
    let ativo = true
    listarEmAndamento()
      .then((lista) => {
        if (ativo) setItens(lista)
      })
      .catch((falha: Error) => {
        if (ativo) setErro(falha.message)
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => {
      ativo = false
    }
  }, [])

  return { itens, carregando, erro, recarregar }
}
