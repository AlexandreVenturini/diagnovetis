import { useMemo, useState } from 'react'
import { Icon } from '../../components/common/Icon'
import { useZoonoses } from '../../hooks/useZoonoses'
import { ConditionForm } from './ConditionForm'
import { AGES, CATEGORIES, EMPTY_FILTERS, ETIOLOGIES, SYSTEMS, filterConditions, type ClinicalFilters } from './clinicalCatalog'

function DogSymbol() {
  return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m8 23-3-7 1 12 4 4v9h5l2-10h13l2 10h5V25l5-4-1-7-7-4-5 7-3 8H15l-7-2Z"/><path d="m34 10-1 12 5 1M17 31l-3-5m16 5 4-5"/><circle cx="38" cy="16" r=".8"/></svg>
}
const show = (value: string | string[]) => (Array.isArray(value) ? value.join(', ') : value) || 'Não informado'

export function ZoonosesModule() {
  const { zoonoses: items, loading, error, updatedAt, refresh, createZoonosis } = useZoonoses()
  const [filters, setFilters] = useState<ClinicalFilters>(EMPTY_FILTERS)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [screen, setScreen] = useState<'browse' | 'create'>('browse')
  const [detail, setDetail] = useState<'summary' | 'full' | 'protocols'>('summary')
  const filtered = useMemo(() => filterConditions(items, filters), [items, filters])
  const selected = filtered.find(item => item.id === selectedId) ?? filtered[0] ?? null
  function update(key: keyof ClinicalFilters, value: string) { setFilters(current => ({ ...current, [key]: value })); setDetail('summary') }
  const stats = [
    { title: 'Condições cadastradas', value: items.length, note: 'Base clínica ativa', color: 'green' },
    { title: 'Zoonoses caninas', value: items.filter(item => item.clinical.isZoonosis).length, note: 'Atenção biossanitária', color: 'teal' },
    { title: 'Protocolos vinculados', value: items.reduce((count, item) => count + item.clinical.protocols.length, 0), note: 'Condutas associadas', color: 'amber' },
    { title: 'Alertas clínicos', value: items.filter(item => item.clinical.alert.trim()).length, note: 'Observações para revisão', color: 'red' },
  ]
  return <section className="conditions-module">
    <header className="conditions-heading"><div><span className="conditions-eyebrow">BASE CLÍNICA CANINA</span><h2>Condições clínicas</h2><p>Consulte doenças, síndromes, zoonoses e protocolos voltados à clínica de cães.</p></div>
      <div className="conditions-sync"><div className={`conditions-status${error ? ' offline' : ''}`} role="status"><strong><i />{loading ? 'Atualizando…' : error ? 'Falha na atualização' : 'Sistema conectado'}</strong><small>{updatedAt ? `Atualizado às ${updatedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Aguardando dados'}</small></div><button className="outline-button" disabled={loading} onClick={() => void refresh()}>Atualizar dados</button></div>
    </header>
    {error && <p className="conditions-error" role="alert">{error}{updatedAt && ' Os últimos dados carregados foram mantidos.'}</p>}
    {screen === 'create' ? <ConditionForm onSave={createZoonosis} onCancel={() => setScreen('browse')} /> : <>
      <div className="conditions-search content-card"><Icon><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></Icon><input aria-label="Buscar condições clínicas" value={filters.query} onChange={e => update('query', e.target.value)} placeholder="Buscar doenças, sinal clínico, agente etiológico…" />{filters.query && <button aria-label="Limpar busca" onClick={() => update('query', '')}>×</button>}</div>
      <div className="conditions-categories"><div role="group" aria-label="Categorias"><button className={!filters.category ? 'active' : ''} aria-pressed={!filters.category} onClick={() => update('category', '')}>Todas</button>{CATEGORIES.map(category => <button className={filters.category === category ? 'active' : ''} aria-pressed={filters.category === category} key={category} onClick={() => update('category', category)}>{category}</button>)}</div><span className="conditions-canine"><DogSymbol />Somente cães</span></div>
      <div className="conditions-filters">
        <Filter label="Sistema" value={filters.system} options={SYSTEMS} empty="Todos os sistemas" onChange={value => update('system', value)} />
        <Filter label="Etiologia" value={filters.etiology} options={ETIOLOGIES} empty="Todas as etiologias" onChange={value => update('etiology', value)} />
        <label>Zoonose<select value={filters.zoonosis} onChange={e => update('zoonosis', e.target.value)}><option value="">Todas</option><option value="yes">Sim</option><option value="no">Não</option></select></label>
        <Filter label="Faixa etária" value={filters.age} options={AGES} empty="Todas as idades" onChange={value => update('age', value)} />
      </div>
      <div className="conditions-stats">{stats.map(stat => <article className={`content-card ${stat.color}`} key={stat.title}><h3>{stat.title}</h3><strong>{!updatedAt ? '—' : stat.value}</strong><p>{stat.note}</p></article>)}</div>
      <div className="conditions-browser">
        <section className="conditions-catalog content-card"><header><h3>Catálogo de condições</h3><label>Ordenar por:<select value={filters.sort} onChange={e => update('sort', e.target.value)}><option value="az">Nome (A–Z)</option><option value="za">Nome (Z–A)</option><option value="risk">Maior risco</option></select></label></header>
          <div className="conditions-list" aria-busy={loading}>{loading && !updatedAt ? <p className="conditions-empty">Carregando catálogo…</p> : filtered.length ? filtered.map(item => <button key={item.id} className={`condition-row${selected?.id === item.id ? ' selected' : ''}`} aria-pressed={selected?.id === item.id} onClick={() => { setSelectedId(item.id); setDetail('summary') }}><span className="condition-avatar"><DogSymbol /></span><span className="condition-row-copy"><span className="condition-row-title"><strong>{item.name}</strong>{item.clinical.isZoonosis && <span className="condition-badge warning">! &nbsp; Zoonose</span>}</span><span>{show(item.clinical.category)} · {show(item.clinical.etiology)}</span><span>Sistema: {show(item.clinical.systems)}</span><span>Sinais principais: {show(item.symptoms)}</span></span><span className="condition-view">Ver detalhes</span><span className="condition-chevron">›</span></button>) : <div className="conditions-empty"><p>{error && !updatedAt ? 'Catálogo indisponível no momento.' : items.length ? 'Nenhuma condição corresponde aos filtros.' : 'Nenhuma condição cadastrada.'}</p>{items.length > 0 && <button className="outline-button" onClick={() => setFilters(EMPTY_FILTERS)}>Limpar filtros</button>}</div>}</div>
          <footer><span>{filtered.length} condição(ões) encontrada(s)</span><button className="conditions-add" onClick={() => setScreen('create')}>＋ Cadastrar condição</button></footer>
        </section>
        <aside className="conditions-summary content-card" aria-label="Resumo clínico"><h3>{detail === 'full' ? 'Ficha clínica completa' : detail === 'protocols' ? 'Protocolos vinculados' : 'Resumo clínico'}</h3>{selected ? <>
          <div className="condition-summary-title"><span className="condition-avatar small"><DogSymbol /></span><div><h4>{selected.name}</h4><div className="condition-badges"><span className="condition-badge">{selected.clinical.conditionType}</span>{selected.clinical.etiology && <span className="condition-badge outline">{selected.clinical.etiology}</span>}{selected.clinical.isZoonosis && <span className="condition-badge warning">! &nbsp; Zoonose</span>}</div></div></div>
          {detail === 'protocols' ? <div className="condition-full"><Info title="Condutas cadastradas" value={selected.clinical.protocols} icon="▤" /><Info title="Prevenção e controle" value={selected.prevention} icon="♧" /></div> : <>
            <Info title="Agente etiológico" value={selected.agent} icon="⚙" /><Info title="Transmissão" value={selected.transmission} icon="♧" /><Info title="Exames sugeridos" value={selected.diagnostics} icon="▤" /><Info title="Diagnósticos diferenciais" value={selected.clinical.differentials} icon="▧" />
            {detail === 'full' && <div className="condition-full"><Info title="Sistemas envolvidos" value={selected.clinical.systems} icon="◇" /><Info title="Sinais clínicos" value={selected.symptoms} icon="!" /><Info title="Faixa etária" value={selected.clinical.ageGroups} icon="◷" /><Info title="Hospedeiros" value={selected.hosts} icon="♧" /><Info title="Nível de risco" value={selected.risk} icon="!" /><Info title="Prevenção e controle" value={selected.prevention} icon="▤" /></div>}
          </>}
          {selected.clinical.isZoonosis && <div className="condition-warning"><b aria-hidden="true">⚠</b><div><strong>Risco zoonótico</strong><p>{selected.prevention.length ? selected.prevention.join('; ') : 'Medidas de prevenção não informadas no cadastro.'}</p></div></div>}
          {selected.clinical.alert && <div className="condition-warning clinical-alert"><div><strong>Alerta clínico</strong><p>{selected.clinical.alert}</p></div></div>}
          <div className="condition-summary-actions"><button className="primary-button" onClick={() => setDetail(detail === 'full' ? 'summary' : 'full')}>▧ &nbsp;{detail === 'full' ? 'Voltar ao resumo' : 'Abrir ficha completa'}</button><button className="outline-button" onClick={() => setDetail(detail === 'protocols' ? 'summary' : 'protocols')}>▤ &nbsp;{detail === 'protocols' ? 'Voltar ao resumo' : 'Ver protocolos'}</button></div>
        </> : <p className="conditions-empty">Selecione uma condição do catálogo para consultar os dados clínicos.</p>}</aside>
      </div>
    </>}
  </section>
}
function Filter({ label, value, options, empty, onChange }: { label: string; value: string; options: string[]; empty: string; onChange: (value: string) => void }) {
  return <label>{label}<select value={value} onChange={e => onChange(e.target.value)}><option value="">{empty}</option>{options.map(option => <option key={option}>{option}</option>)}</select></label>
}
function Info({ title, value, icon }: { title: string; value: string | string[]; icon: string }) {
  return <section className="condition-info"><span aria-hidden="true">{icon}</span><div><h5>{title}</h5>{Array.isArray(value) && value.length > 1 ? <ul>{value.map((text, index) => <li key={index}>{text}</li>)}</ul> : <p>{show(value)}</p>}</div></section>
}
