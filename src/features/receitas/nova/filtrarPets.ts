import type { PetResumo } from '../../pets/petTipos'
const normalizar = (valor: string) =>
  valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim()
export function filtrarPets(pets: PetResumo[], busca: string) {
  const termo = normalizar(busca)
  return termo ? pets.filter((pet) => normalizar(`${pet.nome} ${pet.tutor} #${pet.id}`).includes(termo)) : []
}
