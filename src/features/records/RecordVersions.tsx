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
    <section className="content-card history-card" aria-labelledby="record-versions-title">
      <div className="history-card-header">
        <h3 id="record-versions-title">Histórico de retificações · Atendimento nº {consultaId}</h3>
        <button className="outline-button" type="button" onClick={onClose}>
          Fechar histórico
        </button>
      </div>
      {error && <p className="consultation-message">{error}</p>}
      {!error && !retificacoes && <p>Carregando histórico...</p>}
      {retificacoes?.length === 0 && <p>Este atendimento nunca foi retificado.</p>}
      <div className="history-list">
        {retificacoes?.map((ret) => (
          <article key={ret.versao} className="history-entry">
            <strong>
              Versão {ret.versao} → {ret.versao + 1}
            </strong>
            <p className="history-entry-meta">
              {formatDateTime(ret.alteradoEm)} · Retificado por <b>{ret.alteradoPorNome || '—'}</b>
              {ret.aprovadoPorNome && ret.aprovadoPorNome !== ret.alteradoPorNome && (
                <>
                  {' '}
                  · Autorizado por <b>{ret.aprovadoPorNome}</b>
                </>
              )}
            </p>
            <p className="history-entry-reason">
              <b>Motivo:</b> {ret.motivo}
            </p>
            {ret.alteracoes.length > 0 && (
              <div className="history-diff-wrapper">
                <table className="history-diff">
                  <thead>
                    <tr>
                      <th>Campo</th>
                      <th>Antes</th>
                      <th>Depois</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ret.alteracoes.map((alt) => (
                      <tr key={alt.campo}>
                        <td className="history-diff-field">{alt.rotulo}</td>
                        <td className="history-diff-before">{alt.antes || '—'}</td>
                        <td className="history-diff-after">{alt.depois || '—'}</td>
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
