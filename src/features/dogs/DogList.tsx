import { useState } from 'react'
import { Icon } from '../../components/common/Icon'
import type { Dog } from './dogTypes'
import { formatDogAge } from './dogAge'
import { PeriodFilter } from '../common/PeriodFilter'
import { usePeriod } from '../common/usePeriod'
import { inRange, periodNoun, periodRange } from '../common/period'

type DogListProps = {
  dogs: Dog[]
  onCreate: () => void
  onEdit: (dog: Dog) => void
  onDetails: (dog: Dog) => void
}

export function DogList({ dogs, onCreate, onEdit, onDetails }: DogListProps) {
  const [period, setPeriod] = usePeriod('cadastro')
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR')
  const range = normalizedQuery ? null : periodRange(period)
  const visibleDogs = dogs.filter((dog) => normalizedQuery
    ? `${dog.name} ${dog.tutor} ${dog.breed}`.toLocaleLowerCase('pt-BR').includes(normalizedQuery)
    : inRange(dog.createdAt ?? '', range))

  return (
    <section className="dog-list">
      <div className="section-heading">
        <h2>Cães Cadastrados</h2>
        <button className="primary-button new-button" onClick={onCreate}><span>＋</span> Novo Cadastro</button>
      </div>

      <PeriodFilter label="Período de cadastro" value={period} onChange={setPeriod} searching={Boolean(normalizedQuery)}>
        <label className="agenda-search"><span>Buscar</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Animal, tutor ou raça" /></label>
      </PeriodFilter>

      <div className="agenda-list-heading">
        <h3>{normalizedQuery ? 'Resultado da busca' : `Cadastrados ${periodNoun(period.view)}`}</h3>
        <span>{visibleDogs.length} de {dogs.length} animal(is)</span>
      </div>

      {visibleDogs.length === 0 && <div className="empty-appointments">{normalizedQuery ? 'Nenhum animal encontrado com essa busca.' : 'Nenhum animal cadastrado neste período.'}</div>}

      <div className="dog-grid">
        {visibleDogs.map((dog) => (
          <article className="dog-card" key={dog.id}>
            <div className="dog-card-heading">
              <h3>{dog.name}{dog.deceasedAt && <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '999px', background: '#1f2937', color: '#fff', verticalAlign: 'middle' }}>Óbito</span>}</h3>
              <div className="card-actions">
                <button aria-label={`Ver detalhes de ${dog.name}`} onClick={() => onDetails(dog)}>
                  <Icon><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></Icon>
                </button>
                <button aria-label={`Editar ${dog.name}`} onClick={() => onEdit(dog)}>
                  <Icon><path d="m4 16-1 5 5-1L19 9l-4-4zM13.5 6.5l4 4" /></Icon>
                </button>
              </div>
            </div>
            <p className="breed">{dog.breed}</p>
            <p>Idade: {formatDogAge(dog.age)}</p>
            <p>Peso: {dog.weight} kg</p>
            <p>Tutor: {dog.tutor}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
