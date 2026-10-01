import { useEffect, useRef, useState } from 'react'
import { SupervisaoService } from '../../../services/SupervisaoService'
import { LIBERACAO, LIBERACAO_EXPIRA_MS } from '../tiposLiberacao'
import type { Liberacao, OpcaoEstudante, TipoLiberacao, OpcaoVeterinario } from '../supervisaoTipos'

const supervisaoService = new SupervisaoService()

export type PedidoAguardando = {
  id: string
  supervisor: OpcaoVeterinario
  participantes: OpcaoEstudante[]
  enviadoEm: number
}

type Retornos = {
  aoLiberar: (liberacao: Liberacao) => void
  aoRecusar?: (mensagem: string) => void
  aoMensagem: (mensagem: string) => void
}

export function useAprovacaoRemota(tipo: TipoLiberacao, retornos: Retornos) {
  const [aguardando, setAguardando] = useState<PedidoAguardando | null>(null)
  const retornosRef = useRef(retornos)

  useEffect(() => {
    retornosRef.current = retornos
  })

  useEffect(() => {
    if (!aguardando) return
    let ativo = true
    const pedido = aguardando
    const textos = LIBERACAO[tipo]

    async function verificar() {
      const { aoLiberar, aoRecusar, aoMensagem } = retornosRef.current
      if (Date.now() - pedido.enviadoEm > LIBERACAO_EXPIRA_MS) {
        await supervisaoService.cancelar(pedido.id).catch(() => {})
        if (!ativo) return
        setAguardando(null)
        aoMensagem('O pedido expirou sem resposta. Envie um novo pedido ou use a senha do professor.')
        return
      }
      const situacao = await supervisaoService.buscarSituacao(pedido.id).catch(() => null)
      if (!ativo || !situacao) return
      const concluidoPeloProfessor =
        situacao.status === 'finalizada' &&
        ((tipo === 'receita' && situacao.prescricaoId) || (tipo === 'obito' && situacao.obitoId))
      if (situacao.status === 'aberta' || concluidoPeloProfessor) {
        aoLiberar({ id: pedido.id, supervisor: pedido.supervisor, participantes: pedido.participantes })
      } else if (situacao.status === 'recusada') {
        const motivo = situacao.motivoRecusa ? `: ${situacao.motivoRecusa}` : '.'
        const mensagem = `${pedido.supervisor.nome} recusou ${textos.alvoRecusa}${motivo}`
        setAguardando(null)
        if (aoRecusar) aoRecusar(mensagem)
        else aoMensagem(mensagem)
      } else if (situacao.status === 'cancelada' || situacao.status === 'finalizada') {
        setAguardando(null)
      }
    }

    const parar = supervisaoService.observar(`id=eq.${pedido.id}`, () => {
      void verificar()
    })
    return () => {
      ativo = false
      parar()
    }
  }, [aguardando, tipo])

  async function cancelar() {
    if (!aguardando) return
    await supervisaoService.cancelar(aguardando.id).catch(() => {})
    setAguardando(null)
  }

  return { aguardando, aguardar: setAguardando, cancelar }
}
