import { useEffect, useRef, useState } from 'react'
import { SupervisionService } from '../../../services/SupervisionService'
import { LIBERACAO, LIBERACAO_EXPIRA_MS } from '../liberationKinds'
import type { Liberacao, StudentOption, TipoLiberacao, VeterinarianOption } from '../supervisionTypes'

const supervisionService = new SupervisionService()

export type PedidoAguardando = {
  id: string
  supervisor: VeterinarianOption
  participantes: StudentOption[]
  enviadoEm: number
}

type Callbacks = {
  onLiberado: (liberacao: Liberacao) => void
  onRecusado?: (mensagem: string) => void
  onMessage: (mensagem: string) => void
}

export function useRemoteApproval(tipo: TipoLiberacao, callbacks: Callbacks) {
  const [aguardando, setAguardando] = useState<PedidoAguardando | null>(null)
  const callbacksRef = useRef(callbacks)

  useEffect(() => {
    callbacksRef.current = callbacks
  })

  useEffect(() => {
    if (!aguardando) return
    let active = true
    const pedido = aguardando
    const textos = LIBERACAO[tipo]

    async function verificar() {
      const { onLiberado, onRecusado, onMessage } = callbacksRef.current
      if (Date.now() - pedido.enviadoEm > LIBERACAO_EXPIRA_MS) {
        await supervisionService.cancelar(pedido.id).catch(() => {})
        if (!active) return
        setAguardando(null)
        onMessage('O pedido expirou sem resposta. Envie um novo pedido ou use a senha do professor.')
        return
      }
      const situacao = await supervisionService.buscarSituacao(pedido.id).catch(() => null)
      if (!active || !situacao) return
      const concluidoPeloProfessor =
        situacao.status === 'finalizada' &&
        ((tipo === 'receita' && situacao.prescricaoId) || (tipo === 'obito' && situacao.obitoId))
      if (situacao.status === 'aberta' || concluidoPeloProfessor) {
        onLiberado({ id: pedido.id, supervisor: pedido.supervisor, participantes: pedido.participantes })
      } else if (situacao.status === 'recusada') {
        const motivo = situacao.motivoRecusa ? `: ${situacao.motivoRecusa}` : '.'
        const mensagem = `${pedido.supervisor.nome} recusou ${textos.alvoRecusa}${motivo}`
        setAguardando(null)
        if (onRecusado) onRecusado(mensagem)
        else onMessage(mensagem)
      } else if (situacao.status === 'cancelada' || situacao.status === 'finalizada') {
        setAguardando(null)
      }
    }

    const stop = supervisionService.observar(`id=eq.${pedido.id}`, () => {
      void verificar()
    })
    return () => {
      active = false
      stop()
    }
  }, [aguardando, tipo])

  async function cancelar() {
    if (!aguardando) return
    await supervisionService.cancelar(aguardando.id).catch(() => {})
    setAguardando(null)
  }

  return { aguardando, aguardar: setAguardando, cancelar }
}
