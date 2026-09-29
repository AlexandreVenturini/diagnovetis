import { useEffect, useState } from 'react'
import { compararCampos, listarVersoes } from './retification'
import type { AlteracaoCampo, VersaoConsulta } from './retification'

type Retificacao = VersaoConsulta & { alteracoes: AlteracaoCampo[] }

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function RecordVersions({ consultaId, onClose }: { consultaId: number; onClose: () => void }) {
  const [retificacoes, setRetificacoes] = useState<Retificacao[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    listarVersoes(consultaId)
      .then(({ versoes, atual }) => {
        if (!active) return
        setRetificacoes(
          versoes
            .map((versao, index) => ({
              ...versao,
              alteracoes: compararCampos(versao.dados, versoes[index + 1]?.dados ?? atual),
            }))
            .reverse(),
        )
      })
      .catch((err: Error) => {
        if (active) setError(err.message)
      })
    return () => {
      active = false
    }
  }, [consultaId])

  return (
    <section
      className="content-card"
      style={{ padding: '1.25rem', marginBottom: '1rem' }}
      aria-labelledby="record-versions-title"
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <h3 id="record-versions-title" style={{ margin: 0 }}>
          Histórico de retificações · Atendimento nº {consultaId}
        </h3>
        <button className="outline-button" type="button" onClick={onClose}>
          Fechar histórico
        </button>
      </div>
      {error && <p className="consultation-message">{error}</p>}
      {!error && !retificacoes && <p>Carregando histórico...</p>}
      {retificacoes?.length === 0 && <p>Este atendimento nunca foi retificado.</p>}
      <div style={{ display: 'grid', gap: '0.75rem', marginTop: '0.75rem' }}>
        {retificacoes?.map((ret) => (
          <article
            key={ret.versao}
            style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '0.85rem 1rem' }}
          >
            <strong>
              Versão {ret.versao} → {ret.versao + 1}
            </strong>
            <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#4b5563' }}>
              {formatDateTime(ret.alteradoEm)} · Retificado por <b>{ret.alteradoPorNome || '—'}</b>
              {ret.aprovadoPorNome && ret.aprovadoPorNome !== ret.alteradoPorNome && (
                <>
                  {' '}
                  · Autorizado por <b>{ret.aprovadoPorNome}</b>
                </>
              )}
            </p>
            <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}>
              <b>Motivo:</b> {ret.motivo}
            </p>
            {ret.alteracoes.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                      <th style={{ padding: '0.35rem' }}>Campo</th>
                      <th style={{ padding: '0.35rem' }}>Antes</th>
                      <th style={{ padding: '0.35rem' }}>Depois</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ret.alteracoes.map((alt) => (
                      <tr key={alt.campo} style={{ borderBottom: '1px solid #f3f4f6', verticalAlign: 'top' }}>
                        <td style={{ padding: '0.35rem', fontWeight: 600 }}>{alt.rotulo}</td>
                        <td style={{ padding: '0.35rem', color: '#991b1b', whiteSpace: 'pre-wrap' }}>
                          {alt.antes || '—'}
                        </td>
                        <td style={{ padding: '0.35rem', color: '#166534', whiteSpace: 'pre-wrap' }}>
                          {alt.depois || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
