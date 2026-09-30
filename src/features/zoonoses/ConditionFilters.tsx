import { Icon } from '../../components/common/Icon'
import { AGES, CATEGORIES, ETIOLOGIES, SYSTEMS, type ClinicalFilters } from './clinicalCatalog'
import { DogSymbol } from './DogSymbol'

type ConditionFiltersProps = {
  filters: ClinicalFilters
  onChange: (key: keyof ClinicalFilters, value: string) => void
}

function Filter({
  label,
  value,
  options,
  empty,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  empty: string
  onChange: (value: string) => void
}) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{empty}</option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  )
}

export function ConditionFilters({ filters, onChange }: ConditionFiltersProps) {
  return (
    <>
      <div className="conditions-search content-card">
        <Icon>
          <circle cx="11" cy="11" r="7" />
          <path d="m16 16 5 5" />
        </Icon>
        <input
          aria-label="Buscar condições clínicas"
          value={filters.query}
          onChange={(event) => onChange('query', event.target.value)}
          placeholder="Buscar doenças, sinal clínico, agente etiológico…"
        />
        {filters.query && (
          <button aria-label="Limpar busca" onClick={() => onChange('query', '')}>
            ×
          </button>
        )}
      </div>
      <div className="conditions-categories">
        <div role="group" aria-label="Categorias">
          {['', ...CATEGORIES].map((category) => (
            <button
              className={filters.category === category ? 'active' : ''}
              aria-pressed={filters.category === category}
              key={category || 'todas'}
              onClick={() => onChange('category', category)}
            >
              {category || 'Todas'}
            </button>
          ))}
        </div>
        <span className="conditions-canine">
          <DogSymbol />
          Somente cães
        </span>
      </div>
      <div className="conditions-filters">
        <Filter
          label="Sistema"
          value={filters.system}
          options={SYSTEMS}
          empty="Todos os sistemas"
          onChange={(value) => onChange('system', value)}
        />
        <Filter
          label="Etiologia"
          value={filters.etiology}
          options={ETIOLOGIES}
          empty="Todas as etiologias"
          onChange={(value) => onChange('etiology', value)}
        />
        <label>
          Zoonose
          <select value={filters.zoonosis} onChange={(event) => onChange('zoonosis', event.target.value)}>
            <option value="">Todas</option>
            <option value="yes">Sim</option>
            <option value="no">Não</option>
          </select>
        </label>
        <Filter
          label="Faixa etária"
          value={filters.age}
          options={AGES}
          empty="Todas as idades"
          onChange={(value) => onChange('age', value)}
        />
      </div>
    </>
  )
}
