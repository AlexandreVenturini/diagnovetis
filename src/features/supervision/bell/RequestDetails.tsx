import type { PrescricaoSalva } from '../../../models/Prescricao'
import type { ObitoDados } from '../supervisionTypes'

const simOuNao = (value: boolean) => (value ? 'Sim' : 'Não')

export function PrescriptionItemsList({
  items,
  className,
}: {
  items: PrescricaoSalva['prescription']['items']
  className: string
}) {
  return (
    <ol className={className}>
      {items.map((item, index) => (
        <li key={index}>
          <b>{item.medication}</b> — {item.dose}; {item.route}; {item.frequency}; {item.duration}; qtd: {item.quantity}
        </li>
      ))}
    </ol>
  )
}

export function PrescriptionSummary({ receita, onView }: { receita: PrescricaoSalva; onView: () => void }) {
  return (
    <div className="bell-request-details">
      {receita.patient.weight && <div>Peso: {receita.patient.weight} kg</div>}
      <PrescriptionItemsList items={receita.prescription.items} className="bell-request-items" />
      {receita.prescription.instructions && (
        <div className="bell-request-note">Orientações: {receita.prescription.instructions}</div>
      )}
      <button type="button" className="bell-view-button" onClick={onView}>
        Ver receita completa ⤢
      </button>
    </div>
  )
}

export function DeathSummary({ obito }: { obito: ObitoDados }) {
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
