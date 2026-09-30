import { useState } from 'react'
import { LIBERACAO } from '../liberationKinds'
import type { PedidoLiberacao } from '../supervisionTypes'

export function notificarNavegador(pedido: PedidoLiberacao) {
  if (!('Notification' in window) || Notification.permission !== 'granted' || !document.hidden) return
  try {
    new Notification('DiagnoVetis: pedido de liberação', {
      body: LIBERACAO[pedido.tipo].notificacao(pedido.alunoNome, pedido.consultaAlvo),
    })
  } catch {
    return
  }
}

export function useBrowserAlerts() {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    'Notification' in window ? Notification.permission : 'unsupported',
  )

  async function ativar() {
    if (!('Notification' in window)) return
    setPermission(await Notification.requestPermission())
  }

  return { podeAtivar: permission === 'default', ativar }
}
