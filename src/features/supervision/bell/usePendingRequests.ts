import { useCallback, useEffect, useRef, useState } from 'react'
import { AuthService } from '../../../services/AuthService'
import { SupervisionService } from '../../../services/SupervisionService'
import type { PedidoLiberacao } from '../supervisionTypes'
import { notificarNavegador } from './browserAlerts'

const authService = new AuthService()
const supervisionService = new SupervisionService()

export function usePendingRequests() {
  const [pedidos, setPedidos] = useState<PedidoLiberacao[]>([])
  const knownIds = useRef<Set<string> | null>(null)

  const carregar = useCallback(async () => {
    const lista = await supervisionService.listarPendentes().catch(() => null)
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
    authService.usuarioAtual().then((user) => {
      if (!active || !user) return
      void carregar()
      stop = supervisionService.observar(`supervisor_id=eq.${user.id}`, () => {
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
