import { useState } from 'react'
import type { Dog } from '../dogs/dogTypes'

import { filterAnimals } from './filterAnimals'

export function AnimalSearch({ dogs, selected, onSelect }: { dogs: Dog[]; selected?: Dog; onSelect: (dog: Dog | null) => void }) {
  const [query, setQuery] = useState('')
  const matches = filterAnimals(dogs, query)
  return <div className="rx-animal-search">
    {selected ? <div className="rx-selected-animal"><div><strong>{selected.name}</strong><span>Tutor: {selected.tutor} · #{selected.id}</span></div><button type="button" className="secondary-button" onClick={() => { setQuery(''); onSelect(null) }}>Trocar animal</button></div> : <>
      <label>Buscar animal<input type="search" autoComplete="off" value={query} onChange={event => setQuery(event.target.value)} placeholder="Nome do animal, tutor ou identificação" aria-describedby="rx-animal-help" /></label>
      <p id="rx-animal-help" className="rx-field-help" role="status">{!query.trim() ? 'Digite para localizar o animal. Os resultados aparecerão abaixo.' : matches.length ? `${matches.length} animal(is) encontrado(s). Selecione o paciente correto.${matches.length > 8 ? ' Refine a busca para ver os demais.' : ''}` : 'Nenhum animal encontrado.'}</p>
      {!!query.trim() && matches.length > 0 && <ul className="rx-animal-results" aria-label="Resultados da busca de animais">{matches.slice(0, 8).map(dog => <li key={dog.id}><button type="button" onClick={() => { onSelect(dog); setQuery('') }}><strong>{dog.name}</strong><span>Tutor: {dog.tutor} · #{dog.id}</span></button></li>)}</ul>}
    </>}
  </div>
}
