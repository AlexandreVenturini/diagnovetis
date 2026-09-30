import { useState } from 'react'
import { DeathService } from '../../../services/DeathService'
import { formatDateTime } from './deathRules'
import type { DeathRecord, DeathVersion } from './deathTypes'

const deathService = new DeathService()

type DeathSectionProps = {
  death: DeathRecord
  canRetify: boolean
  onRetify: () => void
}

const yesNo = (value: boolean) => (value ? 'Sim' : 'Não')

export function DeathSection({ death, canRetify, onRetify }: DeathSectionProps) {
  const [versions, setVersions] = useState<DeathVersion[] | null>(null)
  const [showVersions, setShowVersions] = useState(false)
  const [error, setError] = useState('')

  async function toggleVersions() {
    if (showVersions) {
      setShowVersions(false)
      return
    }
    setShowVersions(true)
    if (versions) return
    try {
      setVersions(await deathService.listarVersoes(death.id))
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const field = (label: string, value: string) => (
    <div>
      <dt>{label}</dt>
      <dd>{value || '—'}</dd>
    </div>
  )

  return (
    <section className="content-card death-card" aria-labelledby="death-title">
      <div className="death-card-header">
        <div>
          <h3 id="death-title">Registro de óbito</h3>
          <p className="death-card-meta">
            Registrado por {death.registradoPorNome || '—'}
            {death.aprovadoPorNome && death.aprovadoPorNome !== death.registradoPorNome && (
              <> · aprovado por {death.aprovadoPorNome}</>
            )}{' '}
            em {formatDateTime(death.registradoEm)}
            {death.versao > 1 && (
              <>
                {' '}
                ·{' '}
                <span className="death-card-retified">
                  retificado{death.retificadoPorNome ? ` por ${death.retificadoPorNome}` : ''}
                  {death.retificadoEm ? ` em ${formatDateTime(death.retificadoEm)}` : ''} (versão {death.versao})
                </span>
              </>
            )}
          </p>
        </div>
        <div className="death-card-actions">
          <button type="button" className="outline-button" onClick={() => void toggleVersions()}>
            {showVersions ? 'Ocultar histórico' : 'Histórico de retificações'}
          </button>
          {canRetify && (
            <button type="button" className="primary-button" onClick={onRetify}>
              Retificar registro
            </button>
          )}
        </div>
      </div>

      <dl className="death-fields death-fields--grid">
        {field('Data e hora', formatDateTime(death.dataHora))}
        {field('Profissional responsável', death.medicoResponsavelNome)}
        {field('Eutanásia', yesNo(death.eutanasia))}
        {field('Houve reanimação', yesNo(death.houveReanimacao))}
        {field('Necropsia', yesNo(death.necropsia))}
        {field('Destinação do corpo', death.destinoCorpo)}
        {field(
          'Responsável comunicado',
          death.comunicadoResponsavel
            ? `Sim${death.comunicacaoDetalhes ? ` — ${death.comunicacaoDetalhes}` : ''}`
            : 'Não',
        )}
        {death.consultaId && field('Atendimento relacionado', `Nº ${death.consultaId}`)}
      </dl>
      <dl className="death-fields">
        {field('Circunstâncias', death.circunstancias)}
        {field('Causa provável', death.causaProvavel)}
      </dl>

      {showVersions && (
        <div className="history-list">
          {error && <p className="consultation-message">{error}</p>}
          {!error && !versions && <p>Carregando histórico...</p>}
          {versions?.length === 0 && <p>Este registro nunca foi retificado.</p>}
          {versions?.map((version) => (
            <article key={version.versao} className="history-entry">
              <strong>
                Versão {version.versao} → {version.versao + 1}
              </strong>
              <p className="history-entry-meta">
                {formatDateTime(version.alteradoEm)} · por {version.alteradoPorNome || '—'} · Motivo: {version.motivo}
              </p>
              <ul className="history-changes">
                {version.alteracoes.map((alt) => (
                  <li key={alt.rotulo}>
                    <b>{alt.rotulo}:</b> <span className="history-diff-before">{alt.antes}</span> →{' '}
                    <span className="history-diff-after">{alt.depois}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
