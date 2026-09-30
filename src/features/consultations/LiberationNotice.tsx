import type { Liberacao } from '../supervision/supervisionTypes'

type LiberationNoticeProps = {
  liberacao: Liberacao
  onChange: () => void
  disabled: boolean
}

export function LiberationNotice({ liberacao, onChange, disabled }: LiberationNoticeProps) {
  return (
    <aside className="profile-notice">
      <span>✔</span>
      <p>
        <strong>Atendimento liberado por {liberacao.supervisor.nome}</strong>
        {liberacao.participantes.length > 0 && (
          <> · Participantes: {liberacao.participantes.map((participante) => participante.nome).join(', ')}</>
        )}{' '}
        <button type="button" className="text-back-button" onClick={onChange} disabled={disabled}>
          Trocar liberação
        </button>
      </p>
    </aside>
  )
}
