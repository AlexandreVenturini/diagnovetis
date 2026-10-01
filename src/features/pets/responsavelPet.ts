import type { TipoResponsavel } from '../../models/Tutor'
import type { PetResumo } from './petTipos'

export type SugestoesResponsavel = { pessoa: string[]; instituicao: string[]; ifes: string[] }

const unicos = (valores: string[]) =>
  [...new Set(valores.map((valor) => valor.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'))

export function tipoDoPet(pet: Pick<PetResumo, 'tipoResponsavel'>): TipoResponsavel {
  return pet.tipoResponsavel ?? 'pessoa'
}

export function nomesResponsaveis(pets: PetResumo[]): string[] {
  return unicos(pets.map((pet) => pet.tutor))
}

export function sugestoesResponsavel(pets: PetResumo[]): SugestoesResponsavel {
  const doTipo = (tipo: TipoResponsavel) => pets.filter((pet) => tipoDoPet(pet) === tipo)
  return {
    pessoa: unicos(doTipo('pessoa').map((pet) => pet.tutor)),
    instituicao: unicos(doTipo('instituicao').map((pet) => pet.tutor)),
    ifes: unicos(doTipo('ifes').map((pet) => pet.setor ?? '')),
  }
}
