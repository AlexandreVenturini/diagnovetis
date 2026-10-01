import { useCallback, useEffect, useRef, useState } from 'react'
import { AutenticacaoService } from '../../../services/AutenticacaoService'
import { SupervisaoService } from '../../../services/SupervisaoService'
import type { PedidoLiberacao } from '../supervisaoTipos'
import { notificarNavegador } from './alertasNavegador'

const autenticacaoService = new AutenticacaoService()
const supervisaoService = new SupervisaoService()

export function usePedidosPendentes() {
  const [pedidos, setPedidos] = useState<PedidoLiberacao[]>([])
  const idsConhecidos = useRef<Set<string> | null>(null)

  const carregar = useCallback(async () => {
    const lista = await supervisaoService.listarPendentes().catch(() => null)
    if (!lista) return
    if (idsConhecidos.current) {
      lista.filter((pedido) => !idsConhecidos.current?.has(pedido.id)).forEach(notificarNavegador)
    }
    idsConhecidos.current = new Set(lista.map((pedido) => pedido.id))
    setPedidos(lista)
  }, [])

  useEffect(() => {
    let parar: (() => void) | undefined
    let ativo = true
    autenticacaoService.usuarioAtual().then((usuario) => {
      if (!ativo || !usuario) return
      void carregar()
      parar = supervisaoService.observar(`supervisor_id=eq.${usuario.id}`, () => {
        void carregar()
      })
    })
    return () => {
      ativo = false
      parar?.()
    }
  }, [carregar])

  return { pedidos, recarregar: carregar }
}
