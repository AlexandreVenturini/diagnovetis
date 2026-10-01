import { useState } from 'react'
import type { PetResumo } from '../../pets/petTipos'

import { filtrarPets } from './filtrarPets'

export function BuscaPet({
  pets,
  selecionado,
  aoSelecionar,
}: {
  pets: PetResumo[]
  selecionado?: PetResumo
  aoSelecionar: (pet: PetResumo | null) => void
}) {
  const [busca, setBusca] = useState('')
  const correspondencias = filtrarPets(
    pets.filter((pet) => !pet.obitoEm),
    busca,
  )
  return (
    <div className="rx-animal-search">
      {selecionado ? (
        <div className="rx-selected-animal">
          <div>
            <strong>{selecionado.nome}</strong>
            <span>
              Tutor: {selecionado.tutor} · #{selecionado.id}
            </span>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setBusca('')
              aoSelecionar(null)
            }}
          >
            Trocar animal
          </button>
        </div>
      ) : (
        <>
          <label>
            Buscar animal
            <input
              type="search"
              autoComplete="off"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Nome do animal, tutor ou identificação"
              aria-describedby="rx-animal-help"
            />
          </label>
          <p id="rx-animal-help" className="rx-field-help" role="status">
            {!busca.trim()
              ? 'Digite para localizar o animal. Os resultados aparecerão abaixo.'
              : correspondencias.length
                ? `${correspondencias.length} animal(is) encontrado(s). Selecione o paciente correto.${correspondencias.length > 8 ? ' Refine a busca para ver os demais.' : ''}`
                : 'Nenhum animal encontrado.'}
          </p>
          {!!busca.trim() && correspondencias.length > 0 && (
            <ul className="rx-animal-results" aria-label="Resultados da busca de animais">
              {correspondencias.slice(0, 8).map((pet) => (
                <li key={pet.id}>
                  <button
                    type="button"
                    onClick={() => {
                      aoSelecionar(pet)
                      setBusca('')
                    }}
                  >
                    <strong>{pet.nome}</strong>
                    <span>
                      Tutor: {pet.tutor} · #{pet.id}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
