import { LIBERACAO } from '../liberationKinds'
import type { TipoLiberacao } from '../supervisionTypes'
import type { PedidoAguardando } from './useRemoteApproval'

type WaitingApprovalProps = {
  tipo: TipoLiberacao
  pedido: PedidoAguardando
  onCancel: () => void
}

export function WaitingApproval({ tipo, pedido, onCancel }: WaitingApprovalProps) {
  const textos = LIBERACAO[tipo]
  return (
    <section className="consultation-panel content-card">
      <h2>{textos.tituloAguardando}</h2>
      <p>
        O pedido foi enviado para <strong>{pedido.supervisor.nome}</strong>. Ele aparece no sino no topo da tela do
        professor, que pode aprovar pelo celular ou computador.
      </p>
      {pedido.participantes.length > 0 && (
        <p>Participantes: {pedido.participantes.map((participante) => participante.nome).join(', ')}</p>
      )}
      <p className="supervision-hint">
        Esta tela {textos.aoAprovar} sozinha assim que o professor aprovar. O pedido expira em 30 minutos.
      </p>
      <div className="consultation-next">
        <button className="secondary-button" onClick={onCancel}>
          Cancelar pedido
        </button>
      </div>
    </section>
  )
}
