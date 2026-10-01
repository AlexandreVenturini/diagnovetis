import { useEffect, useRef, useState } from 'react'
import { LIBERACAO } from '../tiposLiberacao'
import type { PedidoLiberacao } from '../supervisaoTipos'
import { useAlertasNavegador } from './alertasNavegador'
import { ModalReceita } from './ModalReceita'
import { FormularioRecusa } from './FormularioRecusa'
import { CartaoPedido } from './CartaoPedido'
import { usePedidosPendentes } from './usePedidosPendentes'
import { useRespostaPedido } from './useRespostaPedido'

function IconeSino() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}

function useFecharAoClicarFora(aberto: boolean, setAberto: (aberto: boolean) => void) {
  const areaRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!aberto) return
    function fechar(evento: MouseEvent) {
      if (areaRef.current && !areaRef.current.contains(evento.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', fechar)
    return () => document.removeEventListener('mousedown', fechar)
  }, [aberto, setAberto])
  return areaRef
}

export function SinoPedidos() {
  const [aberto, setAberto] = useState(false)
  const { pedidos, recarregar } = usePedidosPendentes()
  const resposta = useRespostaPedido(recarregar)
  const alertas = useAlertasNavegador()
  const areaRef = useFecharAoClicarFora(aberto, setAberto)
  const total = pedidos.length
  const visualizando = resposta.visualizando

  function formularioRecusa(pedido: PedidoLiberacao) {
    if (resposta.recusa?.id !== pedido.id) return null
    const { motivo } = resposta.recusa
    return (
      <FormularioRecusa
        motivo={motivo}
        ocupado={resposta.idOcupado === pedido.id}
        aoAlterar={(valor) => resposta.setRecusa({ id: pedido.id, motivo: valor })}
        aoConfirmar={() => resposta.confirmarRecusa(pedido, motivo)}
        aoCancelar={() => resposta.setRecusa(null)}
      />
    )
  }

  return (
    <div ref={areaRef} className="bell">
      <button
        className="header-action"
        onClick={() => setAberto((valor) => !valor)}
        title="Pedidos de liberação"
        aria-label={`Pedidos de liberação${total ? `: ${total} pendente(s)` : ''}`}
      >
        <IconeSino />
        <span className="header-action-label">PEDIDOS</span>
        {total > 0 && <span className="header-action-count">{total}</span>}
      </button>

      {aberto && (
        <div className="bell-dropdown">
          <strong className="bell-title">Pedidos de liberação</strong>
          {total === 0 && <p className="bell-empty">Nenhum pedido pendente.</p>}
          <div className="bell-list">
            {pedidos.map((pedido) => (
              <CartaoPedido
                key={pedido.id}
                pedido={pedido}
                aoVisualizar={() => resposta.setVisualizando(pedido)}
                acoes={
                  formularioRecusa(pedido) ?? (
                    <div className="bell-request-actions">
                      <button
                        className="bell-button bell-button--approve"
                        onClick={() => resposta.aprovar(pedido)}
                        disabled={resposta.idOcupado === pedido.id}
                      >
                        {LIBERACAO[pedido.tipo].botaoAprovar}
                      </button>
                      <button
                        className="bell-button bell-button--reject"
                        onClick={() => resposta.recusar(pedido)}
                        disabled={resposta.idOcupado === pedido.id}
                      >
                        Recusar
                      </button>
                    </div>
                  )
                }
              />
            ))}
          </div>
          {resposta.mensagem && <p className="bell-error">{resposta.mensagem}</p>}
          {alertas.podeAtivar && (
            <button className="bell-alerts-button" onClick={() => void alertas.ativar()}>
              Ativar alertas do navegador
            </button>
          )}
        </div>
      )}

      {visualizando?.receita && (
        <ModalReceita
          pedido={visualizando}
          receita={visualizando.receita}
          aoFechar={() => resposta.setVisualizando(null)}
          mensagem={resposta.mensagem}
          acoes={
            formularioRecusa(visualizando) ?? (
              <div className="bell-modal-actions">
                <button type="button" className="bell-modal-button" onClick={() => resposta.setVisualizando(null)}>
                  Fechar
                </button>
                <button
                  type="button"
                  className="bell-modal-button bell-modal-button--reject"
                  disabled={resposta.idOcupado === visualizando.id}
                  onClick={() => resposta.recusar(visualizando)}
                >
                  Recusar
                </button>
                <button
                  type="button"
                  className="bell-modal-button bell-modal-button--approve"
                  disabled={resposta.idOcupado === visualizando.id}
                  onClick={() => resposta.aprovar(visualizando)}
                >
                  Aprovar e emitir
                </button>
              </div>
            )
          }
        />
      )}
    </div>
  )
}
