import { useState } from 'react'
import { LIBERACAO } from '../tiposLiberacao'
import type { PedidoLiberacao } from '../supervisaoTipos'

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

export function useAlertasNavegador() {
  const [permissao, setPermissao] = useState<NotificationPermission | 'unsupported'>(() =>
    'Notification' in window ? Notification.permission : 'unsupported',
  )

  async function ativar() {
    if (!('Notification' in window)) return
    setPermissao(await Notification.requestPermission())
  }

  return { podeAtivar: permissao === 'default', ativar }
}
