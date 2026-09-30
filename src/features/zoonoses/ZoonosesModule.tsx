import { useMemo, useState } from 'react'
import { useZoonoses } from './useZoonoses'
import { ConditionCatalog } from './ConditionCatalog'
import { ConditionFilters } from './ConditionFilters'
import { ConditionForm } from './ConditionForm'
import { ConditionSummary, type ConditionDetail } from './ConditionSummary'
import { EMPTY_FILTERS, filterConditions, type ClinicalFilters } from './clinicalCatalog'
import type { Zoonosis } from './zoonosisTypes'

function conditionStats(items: Zoonosis[]) {
  return [
    { title: 'Condições cadastradas', value: items.length, note: 'Base clínica ativa', color: 'green' },
    {
      title: 'Zoonoses caninas',
      value: items.filter((item) => item.clinical.isZoonosis).length,
      note: 'Atenção biossanitária',
      color: 'teal',
    },
    {
      title: 'Protocolos vinculados',
      value: items.reduce((count, item) => count + item.clinical.protocols.length, 0),
      note: 'Condutas associadas',
      color: 'amber',
    },
    {
      title: 'Alertas clínicos',
      value: items.filter((item) => item.clinical.alert.trim()).length,
      note: 'Observações para revisão',
      color: 'red',
    },
  ]
}

function statusText(loading: boolean, error: string) {
  if (loading) return 'Atualizando…'
  return error ? 'Falha na atualização' : 'Sistema conectado'
}

export function ZoonosesModule() {
  const { zoonoses: items, loading, error, updatedAt, refresh, createZoonosis } = useZoonoses()
  const [filters, setFilters] = useState<ClinicalFilters>(EMPTY_FILTERS)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [screen, setScreen] = useState<'browse' | 'create'>('browse')
  const [detail, setDetail] = useState<ConditionDetail>('summary')
  const filtered = useMemo(() => filterConditions(items, filters), [items, filters])
  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0] ?? null

  function update(key: keyof ClinicalFilters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }))
    setDetail('summary')
  }

  return (
    <section className="conditions-module">
      <header className="conditions-heading">
        <div>
          <span className="conditions-eyebrow">BASE CLÍNICA CANINA</span>
          <h2>Condições clínicas</h2>
          <p>Consulte doenças, síndromes, zoonoses e protocolos voltados à clínica de cães.</p>
        </div>
        <div className="conditions-sync">
          <div className={`conditions-status${error ? ' offline' : ''}`} role="status">
            <strong>
              <i />
              {statusText(loading, error)}
            </strong>
            <small>
              {updatedAt
                ? `Atualizado às ${updatedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                : 'Aguardando dados'}
            </small>
          </div>
          <button className="outline-button" disabled={loading} onClick={() => void refresh()}>
            Atualizar dados
          </button>
        </div>
      </header>
      {error && (
        <p className="conditions-error" role="alert">
          {error}
          {updatedAt && ' Os últimos dados carregados foram mantidos.'}
        </p>
      )}
      {screen === 'create' ? (
        <ConditionForm onSave={createZoonosis} onCancel={() => setScreen('browse')} />
      ) : (
        <>
          <ConditionFilters filters={filters} onChange={update} />
          <div className="conditions-stats">
            {conditionStats(items).map((stat) => (
              <article className={`content-card ${stat.color}`} key={stat.title}>
                <h3>{stat.title}</h3>
                <strong>{!updatedAt ? '—' : stat.value}</strong>
                <p>{stat.note}</p>
              </article>
            ))}
          </div>
          <div className="conditions-browser">
            <ConditionCatalog
              conditions={filtered}
              totalCount={items.length}
              selectedId={selected?.id ?? null}
              sort={filters.sort}
              onSortChange={(sort) => update('sort', sort)}
              onSelect={(id) => {
                setSelectedId(id)
                setDetail('summary')
              }}
              onClearFilters={() => setFilters(EMPTY_FILTERS)}
              onCreate={() => setScreen('create')}
              loading={loading}
              loaded={Boolean(updatedAt)}
              failed={Boolean(error)}
            />
            <ConditionSummary condition={selected} detail={detail} onDetailChange={setDetail} />
          </div>
        </>
      )}
    </section>
  )
}
