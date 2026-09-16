import type { Dog } from '../dogs/dogTypes'
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim()
export function filterAnimals(dogs: Dog[], query: string) {
  const search = normalize(query)
  return search ? dogs.filter(dog => normalize(`${dog.name} ${dog.tutor} #${dog.id}`).includes(search)) : []
}

