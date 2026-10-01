import { useEffect, useState } from 'react'
import { RetificacaoService } from '../../../services/RetificacaoService'
import { compararCampos } from '../retificacao/retificacaoRegras'
import type { AlteracaoCampo, VersaoConsulta } from '../retificacao/retificacaoRegras'

const retificacaoService = new RetificacaoService()

type Retificacao = VersaoConsulta & { alteracoes: AlteracaoCampo[] }

function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function VersoesAtendimento({ consultaId, aoFechar }: { consultaId: number; aoFechar: () => void }) {
  const [retificacoes, setRetificacoes] = useState<Retificacao[] | null>(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true
    retificacaoService
      .listarVersoes(consultaId)
      .then(({ versoes, atual }) => {
        if (!ativo) return
        setRetificacoes(
          versoes
            .map((versao, indice) => ({
              ...versao,
              alteracoes: compararCampos(versao.dados, versoes[indice + 1]?.dados ?? atual),
            }))
            .reverse(),
        )
      })
      .catch((falha: Error) => {
        if (ativo) setErro(falha.message)
      })
    return () => {
      ativo = false
    }
  }, [consultaId])

  return (
    <section className="content-card history-card" aria-labelledby="record-versions-title">
      <div className="history-card-header">
        <h3 id="record-versions-title">Histórico de retificações · Atendimento nº {consultaId}</h3>
        <button className="outline-button" type="button" onClick={aoFechar}>
          Fechar histórico
        </button>
      </div>
      {erro && <p className="consultation-message">{erro}</p>}
      {!erro && !retificacoes && <p>Carregando histórico...</p>}
      {retificacoes?.length === 0 && <p>Este atendimento nunca foi retificado.</p>}
      <div className="history-list">
        {retificacoes?.map((retorno) => (
          <article key={retorno.versao} className="history-entry">
            <strong>
              Versão {retorno.versao} → {retorno.versao + 1}
            </strong>
            <p className="history-entry-meta">
              {formatarDataHora(retorno.alteradoEm)} · Retificado por <b>{retorno.alteradoPorNome || '—'}</b>
              {retorno.aprovadoPorNome && retorno.aprovadoPorNome !== retorno.alteradoPorNome && (
                <>
                  {' '}
                  · Autorizado por <b>{retorno.aprovadoPorNome}</b>
                </>
              )}
            </p>
            <p className="history-entry-reason">
              <b>Motivo:</b> {retorno.motivo}
            </p>
            {retorno.alteracoes.length > 0 && (
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
                    {retorno.alteracoes.map((alt) => (
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
