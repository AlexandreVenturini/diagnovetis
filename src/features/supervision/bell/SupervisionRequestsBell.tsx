import { useEffect, useRef, useState } from 'react'
import { LIBERACAO } from '../liberationKinds'
import type { PedidoLiberacao } from '../supervisionTypes'
import { useBrowserAlerts } from './browserAlerts'
import { PrescriptionPreviewModal } from './PrescriptionPreviewModal'
import { RefusalForm } from './RefusalForm'
import { RequestCard } from './RequestCard'
import { usePendingRequests } from './usePendingRequests'
import { useRequestResponse } from './useRequestResponse'

function BellIcon() {
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

function useCloseOnOutsideClick(open: boolean, setOpen: (open: boolean) => void) {
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    function fechar(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', fechar)
    return () => document.removeEventListener('mousedown', fechar)
  }, [open, setOpen])
  return containerRef
}

export function SupervisionRequestsBell() {
  const [open, setOpen] = useState(false)
  const { pedidos, recarregar } = usePendingRequests()
  const response = useRequestResponse(recarregar)
  const alerts = useBrowserAlerts()
  const containerRef = useCloseOnOutsideClick(open, setOpen)
  const count = pedidos.length
  const viewing = response.viewing

  function refusalForm(pedido: PedidoLiberacao) {
    if (response.recusa?.id !== pedido.id) return null
    const { motivo } = response.recusa
    return (
      <RefusalForm
        motivo={motivo}
        busy={response.busyId === pedido.id}
        onChange={(value) => response.setRecusa({ id: pedido.id, motivo: value })}
        onConfirm={() => response.confirmarRecusa(pedido, motivo)}
        onCancel={() => response.setRecusa(null)}
      />
    )
  }

  return (
    <div ref={containerRef} className="bell">
      <button
        className="header-action"
        onClick={() => setOpen((value) => !value)}
        title="Pedidos de liberação"
        aria-label={`Pedidos de liberação${count ? `: ${count} pendente(s)` : ''}`}
      >
        <BellIcon />
        <span className="header-action-label">PEDIDOS</span>
        {count > 0 && <span className="header-action-count">{count}</span>}
      </button>

      {open && (
        <div className="bell-dropdown">
          <strong className="bell-title">Pedidos de liberação</strong>
          {count === 0 && <p className="bell-empty">Nenhum pedido pendente.</p>}
          <div className="bell-list">
            {pedidos.map((pedido) => (
              <RequestCard
                key={pedido.id}
                pedido={pedido}
                onView={() => response.setViewing(pedido)}
                actions={
                  refusalForm(pedido) ?? (
                    <div className="bell-request-actions">
                      <button
                        className="bell-button bell-button--approve"
                        onClick={() => response.aprovar(pedido)}
                        disabled={response.busyId === pedido.id}
                      >
                        {LIBERACAO[pedido.tipo].botaoAprovar}
                      </button>
                      <button
                        className="bell-button bell-button--reject"
                        onClick={() => response.recusar(pedido)}
                        disabled={response.busyId === pedido.id}
                      >
                        Recusar
                      </button>
                    </div>
                  )
                }
              />
            ))}
          </div>
          {response.message && <p className="bell-error">{response.message}</p>}
          {alerts.podeAtivar && (
            <button className="bell-alerts-button" onClick={() => void alerts.ativar()}>
              Ativar alertas do navegador
            </button>
          )}
        </div>
      )}

      {viewing?.receita && (
        <PrescriptionPreviewModal
          pedido={viewing}
          receita={viewing.receita}
          onClose={() => response.setViewing(null)}
          message={response.message}
          actions={
            refusalForm(viewing) ?? (
              <div className="bell-modal-actions">
                <button type="button" className="bell-modal-button" onClick={() => response.setViewing(null)}>
                  Fechar
                </button>
                <button
                  type="button"
                  className="bell-modal-button bell-modal-button--reject"
                  disabled={response.busyId === viewing.id}
                  onClick={() => response.recusar(viewing)}
                >
                  Recusar
                </button>
                <button
                  type="button"
                  className="bell-modal-button bell-modal-button--approve"
                  disabled={response.busyId === viewing.id}
                  onClick={() => response.aprovar(viewing)}
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
