import type { ReactNode } from 'react'
import { htmlReceita } from '../../receitas/receita'
import type { PrescricaoSalva } from '../../../models/Prescricao'
import { rotuloDoPedido } from '../tiposLiberacao'
import type { PedidoLiberacao } from '../supervisaoTipos'
import { ListaItensReceita } from './DetalhesPedido'
import { formatarHora } from './formatarHora'

function receitaHtml(receita: PrescricaoSalva) {
  try {
    return htmlReceita(receita.paciente, receita.receita)
  } catch {
    return ''
  }
}

type ModalReceitaProps = {
  pedido: PedidoLiberacao
  receita: PrescricaoSalva
  aoFechar: () => void
  acoes: ReactNode
  mensagem: string
}

export function ModalReceita({ pedido, receita, aoFechar, acoes, mensagem }: ModalReceitaProps) {
  const html = receitaHtml(receita)
  return (
    <div
      role="presentation"
      className="bell-modal-backdrop"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) aoFechar()
      }}
    >
      <section role="dialog" aria-modal="true" aria-labelledby="receita-pedido-titulo" className="bell-modal">
        <div className="bell-modal-header">
          <div>
            <h3 id="receita-pedido-titulo">{rotuloDoPedido(pedido)}</h3>
            <p>
              Montada por <b>{pedido.alunoNome || 'Estudante'}</b>
              {pedido.alunoMatricula && ` (matrícula ${pedido.alunoMatricula})`} às {formatarHora(pedido.criadaEm)}. Ao
              aprovar, a receita é emitida com o seu nome e CRMV.
            </p>
          </div>
          <button type="button" className="bell-modal-close" aria-label="Fechar" onClick={aoFechar}>
            ×
          </button>
        </div>
        {html ? (
          <iframe className="bell-modal-preview" title="Receita enviada para aprovação" sandbox="" srcDoc={html} />
        ) : (
          <ListaItensReceita itens={receita.receita.itens} className="bell-modal-items" />
        )}
        {acoes}
        {mensagem && <p className="bell-error bell-error--modal">{mensagem}</p>}
      </section>
    </div>
  )
}
