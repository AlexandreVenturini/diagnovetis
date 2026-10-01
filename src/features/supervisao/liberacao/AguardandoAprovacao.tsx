import { LIBERACAO } from '../tiposLiberacao'
import type { TipoLiberacao } from '../supervisaoTipos'
import type { PedidoAguardando } from './useAprovacaoRemota'

type AguardandoAprovacaoProps = {
  tipo: TipoLiberacao
  pedido: PedidoAguardando
  aoCancelar: () => void
}

export function AguardandoAprovacao({ tipo, pedido, aoCancelar }: AguardandoAprovacaoProps) {
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
        <button className="secondary-button" onClick={aoCancelar}>
          Cancelar pedido
        </button>
      </div>
    </section>
  )
}
