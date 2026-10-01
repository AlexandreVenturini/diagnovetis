import type { PrescricaoSalva } from '../../../models/Prescricao'
import type { ObitoDados } from '../supervisaoTipos'

const simOuNao = (valor: boolean) => (valor ? 'Sim' : 'Não')

export function ListaItensReceita({
  itens,
  className,
}: {
  itens: PrescricaoSalva['receita']['itens']
  className: string
}) {
  return (
    <ol className={className}>
      {itens.map((item, indice) => (
        <li key={indice}>
          <b>{item.medicamento}</b> — {item.dose}; {item.via}; {item.frequencia}; {item.duracao}; qtd: {item.quantidade}
        </li>
      ))}
    </ol>
  )
}

export function ResumoReceita({ receita, aoVisualizar }: { receita: PrescricaoSalva; aoVisualizar: () => void }) {
  return (
    <div className="bell-request-details">
      {receita.paciente.peso && <div>Peso: {receita.paciente.peso} kg</div>}
      <ListaItensReceita itens={receita.receita.itens} className="bell-request-items" />
      {receita.receita.orientacoes && (
        <div className="bell-request-note">Orientações: {receita.receita.orientacoes}</div>
      )}
      <button type="button" className="bell-view-button" onClick={aoVisualizar}>
        Ver receita completa ⤢
      </button>
    </div>
  )
}

export function ResumoObito({ obito }: { obito: ObitoDados }) {
  const comunicacao = obito.comunicado_responsavel
    ? `Sim${obito.comunicacao_detalhes ? ` — ${obito.comunicacao_detalhes}` : ''}`
    : 'Não'
  return (
    <div className="bell-request-details bell-request-details--grid">
      <div>
        <b>Data e hora:</b>{' '}
        {new Date(obito.data_hora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
      </div>
      <div>
        <b>Circunstâncias:</b> {obito.circunstancias}
      </div>
      {obito.causa_provavel && (
        <div>
          <b>Causa provável:</b> {obito.causa_provavel}
        </div>
      )}
      <div>
        <b>Eutanásia:</b> {simOuNao(obito.eutanasia)} · <b>Reanimação:</b> {simOuNao(obito.houve_reanimacao)} ·{' '}
        <b>Necropsia:</b> {simOuNao(obito.necropsia)}
      </div>
      <div>
        <b>Responsável comunicado:</b> {comunicacao}
      </div>
      <div>
        <b>Destinação do corpo:</b> {obito.destino_corpo}
      </div>
    </div>
  )
}
