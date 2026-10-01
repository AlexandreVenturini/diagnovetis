import { useState } from 'react'
import { ObitoService } from '../../../services/ObitoService'
import { formatarDataHora } from './obitoRegras'
import type { RegistroObito, VersaoObito } from './obitoTipos'

const obitoService = new ObitoService()

type SecaoObitoProps = {
  obito: RegistroObito
  podeRetificar: boolean
  aoRetificar: () => void
}

const simNao = (valor: boolean) => (valor ? 'Sim' : 'Não')

export function SecaoObito({ obito, podeRetificar, aoRetificar }: SecaoObitoProps) {
  const [versoes, setVersoes] = useState<VersaoObito[] | null>(null)
  const [mostrarVersoes, setMostrarVersoes] = useState(false)
  const [erro, setErro] = useState('')

  async function alternarVersoes() {
    if (mostrarVersoes) {
      setMostrarVersoes(false)
      return
    }
    setMostrarVersoes(true)
    if (versoes) return
    try {
      setVersoes(await obitoService.listarVersoes(obito.id))
    } catch (falha) {
      setErro((falha as Error).message)
    }
  }

  const campo = (rotulo: string, valor: string) => (
    <div>
      <dt>{rotulo}</dt>
      <dd>{valor || '—'}</dd>
    </div>
  )

  return (
    <section className="content-card death-card" aria-labelledby="death-title">
      <div className="death-card-header">
        <div>
          <h3 id="death-title">Registro de óbito</h3>
          <p className="death-card-meta">
            Registrado por {obito.registradoPorNome || '—'}
            {obito.aprovadoPorNome && obito.aprovadoPorNome !== obito.registradoPorNome && (
              <> · aprovado por {obito.aprovadoPorNome}</>
            )}{' '}
            em {formatarDataHora(obito.registradoEm)}
            {obito.versao > 1 && (
              <>
                {' '}
                ·{' '}
                <span className="death-card-retified">
                  retificado{obito.retificadoPorNome ? ` por ${obito.retificadoPorNome}` : ''}
                  {obito.retificadoEm ? ` em ${formatarDataHora(obito.retificadoEm)}` : ''} (versão {obito.versao})
                </span>
              </>
            )}
          </p>
        </div>
        <div className="death-card-actions">
          <button type="button" className="outline-button" onClick={() => void alternarVersoes()}>
            {mostrarVersoes ? 'Ocultar histórico' : 'Histórico de retificações'}
          </button>
          {podeRetificar && (
            <button type="button" className="primary-button" onClick={aoRetificar}>
              Retificar registro
            </button>
          )}
        </div>
      </div>

      <dl className="death-fields death-fields--grid">
        {campo('Data e hora', formatarDataHora(obito.dataHora))}
        {campo('Profissional responsável', obito.medicoResponsavelNome)}
        {campo('Eutanásia', simNao(obito.eutanasia))}
        {campo('Houve reanimação', simNao(obito.houveReanimacao))}
        {campo('Necropsia', simNao(obito.necropsia))}
        {campo('Destinação do corpo', obito.destinoCorpo)}
        {campo(
          'Responsável comunicado',
          obito.comunicadoResponsavel
            ? `Sim${obito.comunicacaoDetalhes ? ` — ${obito.comunicacaoDetalhes}` : ''}`
            : 'Não',
        )}
        {obito.consultaId && campo('Atendimento relacionado', `Nº ${obito.consultaId}`)}
      </dl>
      <dl className="death-fields">
        {campo('Circunstâncias', obito.circunstancias)}
        {campo('Causa provável', obito.causaProvavel)}
      </dl>

      {mostrarVersoes && (
        <div className="history-list">
          {erro && <p className="consultation-message">{erro}</p>}
          {!erro && !versoes && <p>Carregando histórico...</p>}
          {versoes?.length === 0 && <p>Este registro nunca foi retificado.</p>}
          {versoes?.map((versao) => (
            <article key={versao.versao} className="history-entry">
              <strong>
                Versão {versao.versao} → {versao.versao + 1}
              </strong>
              <p className="history-entry-meta">
                {formatarDataHora(versao.alteradoEm)} · por {versao.alteradoPorNome || '—'} · Motivo: {versao.motivo}
              </p>
              <ul className="history-changes">
                {versao.alteracoes.map((alt) => (
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
