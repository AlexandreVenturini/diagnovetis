import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../../../services/storage/supabaseClient'
import { listarPedidosPendentes, observarLiberacoes } from '../supervision'
import type { PedidoLiberacao } from '../supervisionTypes'
import { notificarNavegador } from './browserAlerts'

export function usePendingRequests() {
  const [pedidos, setPedidos] = useState<PedidoLiberacao[]>([])
  const knownIds = useRef<Set<string> | null>(null)

  const carregar = useCallback(async () => {
    const lista = await listarPedidosPendentes().catch(() => null)
    if (!lista) return
    if (knownIds.current) {
      lista.filter((pedido) => !knownIds.current?.has(pedido.id)).forEach(notificarNavegador)
    }
    knownIds.current = new Set(lista.map((pedido) => pedido.id))
    setPedidos(lista)
  }, [])

  useEffect(() => {
    let stop: (() => void) | undefined
    let active = true
    supabase.auth.getUser().then(({ data }) => {
      if (!active || !data.user) return
      void carregar()
      stop = observarLiberacoes(`supervisor_id=eq.${data.user.id}`, () => {
        void carregar()
      })
    })
    return () => {
      active = false
      stop?.()
    }
  }, [carregar])

  return { pedidos, recarregar: carregar }
}
