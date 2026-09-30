import type { ReactNode } from 'react'
import { prescriptionHtml } from '../../prescriptions/prescriptionReport'
import type { PrescricaoSalva } from '../../../models/Prescricao'
import { rotuloDoPedido } from '../liberationKinds'
import type { PedidoLiberacao } from '../supervisionTypes'
import { PrescriptionItemsList } from './RequestDetails'
import { formatHora } from './formatHora'

function receitaHtml(receita: PrescricaoSalva) {
  try {
    return prescriptionHtml(receita.patient, receita.prescription)
  } catch {
    return ''
  }
}

type PrescriptionPreviewModalProps = {
  pedido: PedidoLiberacao
  receita: PrescricaoSalva
  onClose: () => void
  actions: ReactNode
  message: string
}

export function PrescriptionPreviewModal({
  pedido,
  receita,
  onClose,
  actions,
  message,
}: PrescriptionPreviewModalProps) {
  const html = receitaHtml(receita)
  return (
    <div
      role="presentation"
      className="bell-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section role="dialog" aria-modal="true" aria-labelledby="receita-pedido-titulo" className="bell-modal">
        <div className="bell-modal-header">
          <div>
            <h3 id="receita-pedido-titulo">{rotuloDoPedido(pedido)}</h3>
            <p>
              Montada por <b>{pedido.alunoNome || 'Estudante'}</b>
              {pedido.alunoMatricula && ` (matrícula ${pedido.alunoMatricula})`} às {formatHora(pedido.criadaEm)}. Ao
              aprovar, a receita é emitida com o seu nome e CRMV.
            </p>
          </div>
          <button type="button" className="bell-modal-close" aria-label="Fechar" onClick={onClose}>
            ×
          </button>
        </div>
        {html ? (
          <iframe className="bell-modal-preview" title="Receita enviada para aprovação" sandbox="" srcDoc={html} />
        ) : (
          <PrescriptionItemsList items={receita.prescription.items} className="bell-modal-items" />
        )}
        {actions}
        {message && <p className="bell-error bell-error--modal">{message}</p>}
      </section>
    </div>
  )
}
