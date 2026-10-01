import { useState } from 'react'
import { Icone } from '../../components/common/Icone'
import type { PetResumo } from './petTipos'
import { formatarIdadePet } from './idadePet'
import { FiltroPeriodo } from '../shared/FiltroPeriodo'
import { usePeriodo } from '../shared/usePeriodo'
import { noIntervalo, nomePeriodo, intervaloPeriodo } from '../shared/periodo'

type ListaPetsProps = {
  pets: PetResumo[]
  aoCriar: () => void
  aoEditar: (pet: PetResumo) => void
  aoDetalhar: (pet: PetResumo) => void
}

export function ListaPets({ pets, aoCriar, aoEditar, aoDetalhar }: ListaPetsProps) {
  const [periodo, setPeriodo] = usePeriodo('cadastro')
  const [busca, setBusca] = useState('')
  const buscaNormalizada = busca.trim().toLocaleLowerCase('pt-BR')
  const intervalo = buscaNormalizada ? null : intervaloPeriodo(periodo)
  const petsVisiveis = pets.filter((pet) =>
    buscaNormalizada
      ? `${pet.nome} ${pet.tutor} ${pet.raca}`.toLocaleLowerCase('pt-BR').includes(buscaNormalizada)
      : noIntervalo(pet.cadastradoEm ?? '', intervalo),
  )

  return (
    <section className="dog-list">
      <div className="section-heading">
        <h2>Cães Cadastrados</h2>
        <button className="primary-button new-button" onClick={aoCriar}>
          <span>＋</span> Novo Cadastro
        </button>
      </div>

      <FiltroPeriodo
        rotulo="Período de cadastro"
        valor={periodo}
        aoAlterar={setPeriodo}
        buscando={Boolean(buscaNormalizada)}
      >
        <label className="agenda-search">
          <span>Buscar</span>
          <input
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="Animal, responsável ou raça"
          />
        </label>
      </FiltroPeriodo>

      <div className="agenda-list-heading">
        <h3>{buscaNormalizada ? 'Resultado da busca' : `Cadastrados ${nomePeriodo(periodo.visao)}`}</h3>
        <span>
          {petsVisiveis.length} de {pets.length} animal(is)
        </span>
      </div>

      {petsVisiveis.length === 0 && (
        <div className="empty-appointments">
          {buscaNormalizada ? 'Nenhum animal encontrado com essa busca.' : 'Nenhum animal cadastrado neste período.'}
        </div>
      )}

      <div className="dog-grid">
        {petsVisiveis.map((pet) => (
          <article className="dog-card" key={pet.id}>
            <div className="dog-card-heading">
              <h3>
                {pet.nome}
                {pet.obitoEm && <span className="pill pill--dark dog-death-pill">Óbito</span>}
              </h3>
              <div className="card-actions">
                <button aria-label={`Ver detalhes de ${pet.nome}`} onClick={() => aoDetalhar(pet)}>
                  <Icone>
                    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="2.5" />
                  </Icone>
                </button>
                <button aria-label={`Editar ${pet.nome}`} onClick={() => aoEditar(pet)}>
                  <Icone>
                    <path d="m4 16-1 5 5-1L19 9l-4-4zM13.5 6.5l4 4" />
                  </Icone>
                </button>
              </div>
            </div>
            <p className="breed">{pet.raca}</p>
            <p>Idade: {formatarIdadePet(pet.idade)}</p>
            <p>Peso: {pet.peso} kg</p>
            <p>Responsável: {pet.tutor}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
