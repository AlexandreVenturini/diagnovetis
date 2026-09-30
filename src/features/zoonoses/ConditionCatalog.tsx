import type { Zoonosis } from './zoonosisTypes'
import { showValue } from './clinicalCatalog'
import { DogSymbol } from './DogSymbol'

type ConditionCatalogProps = {
  conditions: Zoonosis[]
  totalCount: number
  selectedId: number | null
  sort: string
  onSortChange: (sort: string) => void
  onSelect: (id: number) => void
  onClearFilters: () => void
  onCreate: () => void
  loading: boolean
  loaded: boolean
  failed: boolean
}

function ConditionRow({ item, selected, onSelect }: { item: Zoonosis; selected: boolean; onSelect: () => void }) {
  return (
    <button className={`condition-row${selected ? ' selected' : ''}`} aria-pressed={selected} onClick={onSelect}>
      <span className="condition-avatar">
        <DogSymbol />
      </span>
      <span className="condition-row-copy">
        <span className="condition-row-title">
          <strong>{item.name}</strong>
          {item.clinical.isZoonosis && <span className="condition-badge warning">! &nbsp; Zoonose</span>}
        </span>
        <span>
          {showValue(item.clinical.category)} · {showValue(item.clinical.etiology)}
        </span>
        <span>Sistema: {showValue(item.clinical.systems)}</span>
        <span>Sinais principais: {showValue(item.symptoms)}</span>
      </span>
      <span className="condition-view">Ver detalhes</span>
      <span className="condition-chevron">›</span>
    </button>
  )
}

function emptyText(failed: boolean, loaded: boolean, totalCount: number) {
  if (failed && !loaded) return 'Catálogo indisponível no momento.'
  return totalCount ? 'Nenhuma condição corresponde aos filtros.' : 'Nenhuma condição cadastrada.'
}

export function ConditionCatalog({
  conditions,
  totalCount,
  selectedId,
  sort,
  onSortChange,
  onSelect,
  onClearFilters,
  onCreate,
  loading,
  loaded,
  failed,
}: ConditionCatalogProps) {
  function renderList() {
    if (loading && !loaded) return <p className="conditions-empty">Carregando catálogo…</p>
    if (conditions.length)
      return conditions.map((item) => (
        <ConditionRow key={item.id} item={item} selected={selectedId === item.id} onSelect={() => onSelect(item.id)} />
      ))
    return (
      <div className="conditions-empty">
        <p>{emptyText(failed, loaded, totalCount)}</p>
        {totalCount > 0 && (
          <button className="outline-button" onClick={onClearFilters}>
            Limpar filtros
          </button>
        )}
      </div>
    )
  }

  return (
    <section className="conditions-catalog content-card">
      <header>
        <h3>Catálogo de condições</h3>
        <label>
          Ordenar por:
          <select value={sort} onChange={(event) => onSortChange(event.target.value)}>
            <option value="az">Nome (A–Z)</option>
            <option value="za">Nome (Z–A)</option>
            <option value="risk">Maior risco</option>
          </select>
        </label>
      </header>
      <div className="conditions-list" aria-busy={loading}>
        {renderList()}
      </div>
      <footer>
        <span>{conditions.length} condição(ões) encontrada(s)</span>
        <button className="conditions-add" onClick={onCreate}>
          ＋ Cadastrar condição
        </button>
      </footer>
    </section>
  )
}
