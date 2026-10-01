import type { ReactNode } from 'react'
import { rotuloDoPedido } from '../tiposLiberacao'
import type { PedidoLiberacao } from '../supervisaoTipos'
import { ResumoObito, ResumoReceita } from './DetalhesPedido'
import { formatarHora } from './formatarHora'

type CartaoPedidoProps = {
  pedido: PedidoLiberacao
  aoVisualizar: () => void
  acoes: ReactNode
}

export function CartaoPedido({ pedido, aoVisualizar, acoes }: CartaoPedidoProps) {
  return (
    <div className="bell-request">
      <div className={`bell-request-type bell-request-type--${pedido.tipo}`}>{rotuloDoPedido(pedido)}</div>
      <div className="bell-request-student">{pedido.alunoNome || 'Estudante'}</div>
      <div className="bell-request-meta">
        {pedido.alunoMatricula && <>Matrícula {pedido.alunoMatricula} · </>}Pedido às {formatarHora(pedido.criadaEm)}
      </div>
      {pedido.receita && <ResumoReceita receita={pedido.receita} aoVisualizar={aoVisualizar} />}
      {pedido.obito && <ResumoObito obito={pedido.obito} />}
      {pedido.participantes.length > 0 && (
        <div className="bell-request-participants">Participantes: {pedido.participantes.join(', ')}</div>
      )}
      {acoes}
    </div>
  )
}
