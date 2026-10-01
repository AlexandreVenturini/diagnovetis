import type { Medico } from '../../../models/Medico'
import type { PetResumo } from '../../pets/petTipos'
import { BuscaPet } from './BuscaPet'
import type { RascunhoReceita } from './useRascunhoReceita'

type SecaoPetProps = {
  pets: PetResumo[]
  medicos: Medico[]
  rascunho: RascunhoReceita
  ehEstudante: boolean
}

export function SecaoPet({ pets, medicos, rascunho, ehEstudante }: SecaoPetProps) {
  const { pet } = rascunho
  return (
    <section className="content-card consultation-panel">
      <h3>1. Animal, tutor e veterinário</h3>
      <div className="consultation-form-grid">
        <BuscaPet pets={pets} selecionado={pet} aoSelecionar={rascunho.selecionarPet} />
        <label>
          Tutor
          <input readOnly value={pet?.tutor ?? ''} />
        </label>
        <label>
          Identificação
          <input readOnly value={pet ? `#${pet.id} · ${pet.raca} · ${pet.sexo}` : ''} />
        </label>
        <label>
          Peso atual (kg)
          <input
            inputMode="decimal"
            value={rascunho.peso}
            onChange={(evento) => rascunho.alterarPeso(evento.target.value)}
          />
        </label>
        {ehEstudante ? (
          <label>
            Veterinário
            <input readOnly value="Definido na aprovação da receita" />
          </label>
        ) : (
          <label>
            Veterinário
            <select
              value={rascunho.veterinarioId}
              onChange={(evento) => rascunho.selecionarVeterinario(evento.target.value)}
            >
              <option value="">Selecione o veterinário</option>
              {medicos.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome} — {item.crmv}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </section>
  )
}
