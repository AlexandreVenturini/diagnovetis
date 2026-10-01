import type { Condicao } from './condicaoTipos'
import { mostrarValor } from './catalogoClinico'
import { SimboloCao } from './SimboloCao'

export type DetalheCondicao = 'resumo' | 'completa' | 'protocolos'

const TITULOS_DETALHE: Record<DetalheCondicao, string> = {
  resumo: 'Resumo clínico',
  completa: 'Ficha clínica completa',
  protocolos: 'Protocolos vinculados',
}

type ResumoCondicaoProps = {
  condicao: Condicao | null
  detalhe: DetalheCondicao
  aoAlterarDetalhe: (detalhe: DetalheCondicao) => void
}

function Informacao({ titulo, valor, icone }: { titulo: string; valor: string | string[]; icone: string }) {
  return (
    <section className="condition-info">
      <span aria-hidden="true">{icone}</span>
      <div>
        <h5>{titulo}</h5>
        {Array.isArray(valor) && valor.length > 1 ? (
          <ul>
            {valor.map((texto, indice) => (
              <li key={indice}>{texto}</li>
            ))}
          </ul>
        ) : (
          <p>{mostrarValor(valor)}</p>
        )}
      </div>
    </section>
  )
}

function InfoCondicao({ condicao, detalhe }: { condicao: Condicao; detalhe: DetalheCondicao }) {
  if (detalhe === 'protocolos')
    return (
      <div className="condition-full">
        <Informacao titulo="Condutas cadastradas" valor={condicao.dadosClinicos.protocolos} icone="▤" />
        <Informacao titulo="Prevenção e controle" valor={condicao.prevencao} icone="♧" />
      </div>
    )
  return (
    <>
      <Informacao titulo="Agente etiológico" valor={condicao.agente} icone="⚙" />
      <Informacao titulo="Transmissão" valor={condicao.transmissao} icone="♧" />
      <Informacao titulo="Exames sugeridos" valor={condicao.examesSugeridos} icone="▤" />
      <Informacao titulo="Diagnósticos diferenciais" valor={condicao.dadosClinicos.diferenciais} icone="▧" />
      {detalhe === 'completa' && (
        <div className="condition-full">
          <Informacao titulo="Sistemas envolvidos" valor={condicao.dadosClinicos.sistemas} icone="◇" />
          <Informacao titulo="Sinais clínicos" valor={condicao.sintomas} icone="!" />
          <Informacao titulo="Faixa etária" valor={condicao.dadosClinicos.faixasEtarias} icone="◷" />
          <Informacao titulo="Hospedeiros" valor={condicao.hospedeiros} icone="♧" />
          <Informacao titulo="Nível de risco" valor={condicao.risco} icone="!" />
          <Informacao titulo="Prevenção e controle" valor={condicao.prevencao} icone="▤" />
        </div>
      )}
    </>
  )
}

export function ResumoCondicao({ condicao, detalhe, aoAlterarDetalhe }: ResumoCondicaoProps) {
  const alternar = (alvo: DetalheCondicao) => aoAlterarDetalhe(detalhe === alvo ? 'resumo' : alvo)
  return (
    <aside className="conditions-summary content-card" aria-label="Resumo clínico">
      <h3>{TITULOS_DETALHE[detalhe]}</h3>
      {condicao ? (
        <>
          <div className="condition-summary-title">
            <span className="condition-avatar small">
              <SimboloCao />
            </span>
            <div>
              <h4>{condicao.nome}</h4>
              <div className="condition-badges">
                <span className="condition-badge">{condicao.dadosClinicos.tipoCondicao}</span>
                {condicao.dadosClinicos.etiologia && (
                  <span className="condition-badge outline">{condicao.dadosClinicos.etiologia}</span>
                )}
                {condicao.dadosClinicos.ehZoonose && <span className="condition-badge warning">! &nbsp; Zoonose</span>}
              </div>
            </div>
          </div>
          <InfoCondicao condicao={condicao} detalhe={detalhe} />
          {condicao.dadosClinicos.ehZoonose && (
            <div className="condition-warning">
              <b aria-hidden="true">⚠</b>
              <div>
                <strong>Risco zoonótico</strong>
                <p>
                  {condicao.prevencao.length
                    ? condicao.prevencao.join('; ')
                    : 'Medidas de prevenção não informadas no cadastro.'}
                </p>
              </div>
            </div>
          )}
          {condicao.dadosClinicos.alerta && (
            <div className="condition-warning clinical-alert">
              <div>
                <strong>Alerta clínico</strong>
                <p>{condicao.dadosClinicos.alerta}</p>
              </div>
            </div>
          )}
          <div className="condition-summary-actions">
            <button className="primary-button" onClick={() => alternar('completa')}>
              ▧ &nbsp;{detalhe === 'completa' ? 'Voltar ao resumo' : 'Abrir ficha completa'}
            </button>
            <button className="outline-button" onClick={() => alternar('protocolos')}>
              ▤ &nbsp;{detalhe === 'protocolos' ? 'Voltar ao resumo' : 'Ver protocolos'}
            </button>
          </div>
        </>
      ) : (
        <p className="conditions-empty">Selecione uma condição do catálogo para consultar os dados clínicos.</p>
      )}
    </aside>
  )
}
