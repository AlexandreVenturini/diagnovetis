import type { ReactNode } from 'react'
import { rotuloDoPedido } from '../liberationKinds'
import type { PedidoLiberacao } from '../supervisionTypes'
import { DeathSummary, PrescriptionSummary } from './RequestDetails'
import { formatHora } from './formatHora'

type RequestCardProps = {
  pedido: PedidoLiberacao
  onView: () => void
  actions: ReactNode
}

export function RequestCard({ pedido, onView, actions }: RequestCardProps) {
  return (
    <div className="bell-request">
      <div className={`bell-request-type bell-request-type--${pedido.tipo}`}>{rotuloDoPedido(pedido)}</div>
      <div className="bell-request-student">{pedido.alunoNome || 'Estudante'}</div>
      <div className="bell-request-meta">
        {pedido.alunoMatricula && <>Matrícula {pedido.alunoMatricula} · </>}Pedido às {formatHora(pedido.criadaEm)}
      </div>
      {pedido.receita && <PrescriptionSummary receita={pedido.receita} onView={onView} />}
      {pedido.obito && <DeathSummary obito={pedido.obito} />}
      {pedido.participantes.length > 0 && (
        <div className="bell-request-participants">Participantes: {pedido.participantes.join(', ')}</div>
      )}
      {actions}
    </div>
  )
}
