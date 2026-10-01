import type { Medico } from '../../../models/Medico'
import type { Medicamento } from '../../../models/Medicamento'
import { EditorReceita } from './EditorReceita'
import type { PetResumo } from '../../pets/petTipos'
import { CalculadoraDose } from './CalculadoraDose'
import { BuscaMedicamento } from './BuscaMedicamento'
import { SecaoPet } from './SecaoPet'
import type { RascunhoReceita } from './useRascunhoReceita'

type FormularioNovaReceitaProps = {
  pets: PetResumo[]
  medicos: Medico[]
  medicamentos: Medicamento[]
  rascunho: RascunhoReceita
  ehEstudante: boolean
  aoRevisar: () => void
}

export function FormularioNovaReceita({
  pets,
  medicos,
  medicamentos,
  rascunho,
  ehEstudante,
  aoRevisar,
}: FormularioNovaReceitaProps) {
  return (
    <>
      <SecaoPet pets={pets} medicos={medicos} rascunho={rascunho} ehEstudante={ehEstudante} />
      <BuscaMedicamento medicamentos={medicamentos} rascunho={rascunho} />
      <CalculadoraDose rascunho={rascunho} />
      <EditorReceita ocultarCrmv={ehEstudante} valor={rascunho.receita} aoAlterar={rascunho.alterarReceita} />
      <div className="form-actions">
        <button className="primary-button" onClick={aoRevisar}>
          Visualizar receita
        </button>
      </div>
    </>
  )
}
