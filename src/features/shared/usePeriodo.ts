import { useCallback, useState } from 'react'
import { VISOES_PERIODO, dataParaCampo } from './periodo'
import type { Periodo, VisaoPeriodo } from './periodo'

const chaveArmazenamento = (tela: string) => `diagnovetis:periodo:${tela}`

function lerVisaoSalva(tela: string): VisaoPeriodo | null {
  try {
    const armazenado = localStorage.getItem(chaveArmazenamento(tela))
    return VISOES_PERIODO.some((item) => item.visao === armazenado) ? (armazenado as VisaoPeriodo) : null
  } catch {
    return null
  }
}

export function usePeriodo(tela: string, visaoPadrao: VisaoPeriodo = 'mes') {
  const [valor, setValor] = useState<Periodo>(() => ({
    visao: lerVisaoSalva(tela) ?? visaoPadrao,
    data: dataParaCampo(),
  }))

  const alteracao = useCallback(
    (proximo: Periodo) => {
      setValor(proximo)
      try {
        localStorage.setItem(chaveArmazenamento(tela), proximo.visao)
      } catch {
        return
      }
    },
    [tela],
  )

  return [valor, alteracao] as const
}
