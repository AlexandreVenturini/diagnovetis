import type { Liberacao } from '../supervisao/supervisaoTipos'

type AvisoLiberacaoProps = {
  liberacao: Liberacao
  aoAlterar: () => void
  desabilitado: boolean
}

export function AvisoLiberacao({ liberacao, aoAlterar, desabilitado }: AvisoLiberacaoProps) {
  return (
    <aside className="profile-notice">
      <span>✔</span>
      <p>
        <strong>Atendimento liberado por {liberacao.supervisor.nome}</strong>
        {liberacao.participantes.length > 0 && (
          <> · Participantes: {liberacao.participantes.map((participante) => participante.nome).join(', ')}</>
        )}{' '}
        <button type="button" className="text-back-button" onClick={aoAlterar} disabled={desabilitado}>
          Trocar liberação
        </button>
      </p>
    </aside>
  )
}
