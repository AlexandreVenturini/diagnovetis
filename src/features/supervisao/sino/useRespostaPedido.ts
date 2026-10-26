import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { SupervisaoService } from '../../../services/SupervisaoService'
import { LIBERACAO } from '../tiposLiberacao'
import type { PedidoLiberacao } from '../supervisaoTipos'
import { CHAVES } from '../../shared/consultas'

const supervisaoService = new SupervisaoService()

export type Recusa = { id: string; motivo: string }

function mensagemDeErro(texto: string) {
  if (texto.includes('expirado')) return 'Este pedido expirou.'
  if (texto.includes('respondido')) return 'Este pedido já foi respondido ou cancelado pelo aluno.'
  return 'Não foi possível responder o pedido.'
}

const AFETADOS_PELA_APROVACAO = [
  CHAVES.receitas,
  CHAVES.receitasDoPet,
  CHAVES.prontuario,
  CHAVES.resumosProntuario,
  CHAVES.pets,
]

export function useRespostaPedido(aoResponder: () => Promise<void>) {
  const cliente = useQueryClient()
  const [idOcupado, setIdOcupado] = useState<string | null>(null)
  const [visualizando, setVisualizando] = useState<PedidoLiberacao | null>(null)
  const [recusa, setRecusa] = useState<Recusa | null>(null)
  const [mensagem, setMensagem] = useState('')

  async function responder(pedido: PedidoLiberacao, aprovar: boolean, motivo: string | null = null) {
    if (!aprovar && LIBERACAO[pedido.tipo].exigeMotivoRecusa && !motivo?.trim()) {
      setMensagem('Informe o motivo da recusa para o estudante corrigir.')
      return
    }
    setIdOcupado(pedido.id)
    setMensagem('')
    try {
      await supervisaoService.responder(pedido.id, aprovar, motivo)
      if (aprovar) for (const chave of AFETADOS_PELA_APROVACAO) void cliente.invalidateQueries({ queryKey: chave })
    } catch (erro) {
      setMensagem(mensagemDeErro((erro as Error).message))
    } finally {
      setIdOcupado(null)
      setVisualizando(null)
      setRecusa(null)
      await aoResponder()
    }
  }

  function recusar(pedido: PedidoLiberacao) {
    if (LIBERACAO[pedido.tipo].exigeMotivoRecusa) {
      setRecusa({ id: pedido.id, motivo: '' })
      setMensagem('')
      return
    }
    void responder(pedido, false)
  }

  return {
    idOcupado,
    visualizando,
    setVisualizando,
    recusa,
    setRecusa,
    mensagem,
    aprovar: (pedido: PedidoLiberacao) => void responder(pedido, true),
    recusar,
    confirmarRecusa: (pedido: PedidoLiberacao, motivo: string) => void responder(pedido, false, motivo),
  }
}
