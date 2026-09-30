import { useState } from 'react'
import { responderLiberacao } from '../supervision'
import { LIBERACAO } from '../liberationKinds'
import type { PedidoLiberacao } from '../supervisionTypes'

export type Recusa = { id: string; motivo: string }

function mensagemDeErro(text: string) {
  if (text.includes('expirado')) return 'Este pedido expirou.'
  if (text.includes('respondido')) return 'Este pedido já foi respondido ou cancelado pelo aluno.'
  return 'Não foi possível responder o pedido.'
}

export function useRequestResponse(onResponded: () => Promise<void>) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const [viewing, setViewing] = useState<PedidoLiberacao | null>(null)
  const [recusa, setRecusa] = useState<Recusa | null>(null)
  const [message, setMessage] = useState('')

  async function responder(pedido: PedidoLiberacao, aprovar: boolean, motivo: string | null = null) {
    if (!aprovar && LIBERACAO[pedido.tipo].exigeMotivoRecusa && !motivo?.trim()) {
      setMessage('Informe o motivo da recusa para o estudante corrigir.')
      return
    }
    setBusyId(pedido.id)
    setMessage('')
    try {
      await responderLiberacao(pedido.id, aprovar, motivo)
    } catch (error) {
      setMessage(mensagemDeErro((error as Error).message))
    } finally {
      setBusyId(null)
      setViewing(null)
      setRecusa(null)
      await onResponded()
    }
  }

  function recusar(pedido: PedidoLiberacao) {
    if (LIBERACAO[pedido.tipo].exigeMotivoRecusa) {
      setRecusa({ id: pedido.id, motivo: '' })
      setMessage('')
      return
    }
    void responder(pedido, false)
  }

  return {
    busyId,
    viewing,
    setViewing,
    recusa,
    setRecusa,
    message,
    aprovar: (pedido: PedidoLiberacao) => void responder(pedido, true),
    recusar,
    confirmarRecusa: (pedido: PedidoLiberacao, motivo: string) => void responder(pedido, false, motivo),
  }
}
