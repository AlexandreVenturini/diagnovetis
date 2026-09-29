import { useState } from 'react'
import { formatDateTime, listarVersoesObito } from './death'
import type { DeathRecord, DeathVersion } from './death'

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
      setVersions(await listarVersoesObito(death.id))
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const field = (label: string, value: string) => (
    <div>
      <dt style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>{label}</dt>
      <dd style={{ margin: '0.1rem 0 0', whiteSpace: 'pre-wrap' }}>{value || '—'}</dd>
    </div>
  )

  return (
    <section
      className="content-card"
      style={{ padding: '1rem 1.25rem', marginBottom: '1rem', borderLeft: '5px solid #1f2937' }}
      aria-labelledby="death-title"
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h3 id="death-title" style={{ margin: 0 }}>
            Registro de óbito
          </h3>
          <p style={{ margin: '0.25rem 0 0', color: '#4b5563', fontSize: '0.875rem' }}>
            Registrado por {death.registradoPorNome || '—'}
            {death.aprovadoPorNome && death.aprovadoPorNome !== death.registradoPorNome && (
              <> · aprovado por {death.aprovadoPorNome}</>
            )}{' '}
            em {formatDateTime(death.registradoEm)}
            {death.versao > 1 && (
              <>
                {' '}
                ·{' '}
                <span style={{ color: '#854d0e' }}>
                  retificado{death.retificadoPorNome ? ` por ${death.retificadoPorNome}` : ''}
                  {death.retificadoEm ? ` em ${formatDateTime(death.retificadoEm)}` : ''} (versão {death.versao})
                </span>
              </>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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

      <dl
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.75rem 1.25rem',
          margin: '1rem 0 0',
        }}
      >
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
      <dl style={{ display: 'grid', gap: '0.75rem', margin: '0.75rem 0 0' }}>
        {field('Circunstâncias', death.circunstancias)}
        {field('Causa provável', death.causaProvavel)}
      </dl>

      {showVersions && (
        <div style={{ marginTop: '1rem', display: 'grid', gap: '0.6rem' }}>
          {error && <p className="consultation-message">{error}</p>}
          {!error && !versions && <p>Carregando histórico...</p>}
          {versions?.length === 0 && <p>Este registro nunca foi retificado.</p>}
          {versions?.map((version) => (
            <article
              key={version.versao}
              style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '0.75rem 1rem' }}
            >
              <strong>
                Versão {version.versao} → {version.versao + 1}
              </strong>
              <p style={{ margin: '0.2rem 0', fontSize: '0.85rem', color: '#4b5563' }}>
                {formatDateTime(version.alteradoEm)} · por {version.alteradoPorNome || '—'} · Motivo: {version.motivo}
              </p>
              <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.1rem', fontSize: '0.85rem' }}>
                {version.alteracoes.map((alt) => (
                  <li key={alt.rotulo}>
                    <b>{alt.rotulo}:</b> <span style={{ color: '#991b1b' }}>{alt.antes}</span> →{' '}
                    <span style={{ color: '#166534' }}>{alt.depois}</span>
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
