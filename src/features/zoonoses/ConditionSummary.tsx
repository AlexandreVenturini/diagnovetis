import type { Zoonosis } from './zoonosisTypes'
import { showValue } from './clinicalCatalog'
import { DogSymbol } from './DogSymbol'

export type ConditionDetail = 'summary' | 'full' | 'protocols'

const DETAIL_TITLES: Record<ConditionDetail, string> = {
  summary: 'Resumo clínico',
  full: 'Ficha clínica completa',
  protocols: 'Protocolos vinculados',
}

type ConditionSummaryProps = {
  condition: Zoonosis | null
  detail: ConditionDetail
  onDetailChange: (detail: ConditionDetail) => void
}

function Info({ title, value, icon }: { title: string; value: string | string[]; icon: string }) {
  return (
    <section className="condition-info">
      <span aria-hidden="true">{icon}</span>
      <div>
        <h5>{title}</h5>
        {Array.isArray(value) && value.length > 1 ? (
          <ul>
            {value.map((text, index) => (
              <li key={index}>{text}</li>
            ))}
          </ul>
        ) : (
          <p>{showValue(value)}</p>
        )}
      </div>
    </section>
  )
}

function ConditionInfo({ condition, detail }: { condition: Zoonosis; detail: ConditionDetail }) {
  if (detail === 'protocols')
    return (
      <div className="condition-full">
        <Info title="Condutas cadastradas" value={condition.clinical.protocols} icon="▤" />
        <Info title="Prevenção e controle" value={condition.prevention} icon="♧" />
      </div>
    )
  return (
    <>
      <Info title="Agente etiológico" value={condition.agent} icon="⚙" />
      <Info title="Transmissão" value={condition.transmission} icon="♧" />
      <Info title="Exames sugeridos" value={condition.diagnostics} icon="▤" />
      <Info title="Diagnósticos diferenciais" value={condition.clinical.differentials} icon="▧" />
      {detail === 'full' && (
        <div className="condition-full">
          <Info title="Sistemas envolvidos" value={condition.clinical.systems} icon="◇" />
          <Info title="Sinais clínicos" value={condition.symptoms} icon="!" />
          <Info title="Faixa etária" value={condition.clinical.ageGroups} icon="◷" />
          <Info title="Hospedeiros" value={condition.hosts} icon="♧" />
          <Info title="Nível de risco" value={condition.risk} icon="!" />
          <Info title="Prevenção e controle" value={condition.prevention} icon="▤" />
        </div>
      )}
    </>
  )
}

export function ConditionSummary({ condition, detail, onDetailChange }: ConditionSummaryProps) {
  const toggle = (target: ConditionDetail) => onDetailChange(detail === target ? 'summary' : target)
  return (
    <aside className="conditions-summary content-card" aria-label="Resumo clínico">
      <h3>{DETAIL_TITLES[detail]}</h3>
      {condition ? (
        <>
          <div className="condition-summary-title">
            <span className="condition-avatar small">
              <DogSymbol />
            </span>
            <div>
              <h4>{condition.name}</h4>
              <div className="condition-badges">
                <span className="condition-badge">{condition.clinical.conditionType}</span>
                {condition.clinical.etiology && (
                  <span className="condition-badge outline">{condition.clinical.etiology}</span>
                )}
                {condition.clinical.isZoonosis && <span className="condition-badge warning">! &nbsp; Zoonose</span>}
              </div>
            </div>
          </div>
          <ConditionInfo condition={condition} detail={detail} />
          {condition.clinical.isZoonosis && (
            <div className="condition-warning">
              <b aria-hidden="true">⚠</b>
              <div>
                <strong>Risco zoonótico</strong>
                <p>
                  {condition.prevention.length
                    ? condition.prevention.join('; ')
                    : 'Medidas de prevenção não informadas no cadastro.'}
                </p>
              </div>
            </div>
          )}
          {condition.clinical.alert && (
            <div className="condition-warning clinical-alert">
              <div>
                <strong>Alerta clínico</strong>
                <p>{condition.clinical.alert}</p>
              </div>
            </div>
          )}
          <div className="condition-summary-actions">
            <button className="primary-button" onClick={() => toggle('full')}>
              ▧ &nbsp;{detail === 'full' ? 'Voltar ao resumo' : 'Abrir ficha completa'}
            </button>
            <button className="outline-button" onClick={() => toggle('protocols')}>
              ▤ &nbsp;{detail === 'protocols' ? 'Voltar ao resumo' : 'Ver protocolos'}
            </button>
          </div>
        </>
      ) : (
        <p className="conditions-empty">Selecione uma condição do catálogo para consultar os dados clínicos.</p>
      )}
    </aside>
  )
}
