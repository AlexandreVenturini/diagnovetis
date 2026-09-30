import { useCallback, useEffect, useState } from 'react'
import { Endereco } from '../../models/Endereco'
import { Pet } from '../../models/Pet'
import { Tutor } from '../../models/Tutor'
import { PetService } from '../../services/PetService'
import { TutorService } from '../../services/TutorService'
import { dateInput } from '../common/period'
import type { TutorFormData } from '../tutors/tutorTypes'
import type { Dog, DogFormData } from './dogTypes'

const petService = new PetService()
const tutorService = new TutorService()

export class TutorNotFoundError extends Error {
  constructor(nome: string) {
    super(`Tutor '${nome}' não encontrado. Cadastre o tutor completo antes de registrar o cão.`)
    this.name = 'TutorNotFoundError'
  }
}

function petToDog(pet: Pet): Dog {
  return {
    id: pet.id,
    name: pet.nome,
    breed: pet.raca,
    age: pet.idade,
    weight: pet.peso,
    sex: pet.sexo,
    tutor: pet.tutor.nome,
    contact: pet.tutor.telefone,
    history: pet.historico,
    createdAt: pet.criadoEm ? dateInput(new Date(pet.criadoEm)) : '',
    deceasedAt: pet.obitoEm ? dateInput(new Date(pet.obitoEm)) : '',
  }
}

function formToTutor(id: number, form: TutorFormData): Tutor {
  return new Tutor(
    id,
    form.name.trim(),
    form.phone.trim(),
    form.email.trim(),
    new Date(`${form.registrationDate}T12:00:00`),
    new Endereco(
      form.street.trim(),
      Number(form.number),
      form.neighborhood.trim(),
      form.city.trim(),
      form.state.trim().toUpperCase(),
      form.zipCode.trim(),
    ),
    [],
    form.cpf?.trim() ?? '',
  )
}

async function findTutor(nome: string): Promise<Tutor> {
  const [tutor] = await tutorService.buscarPorNome(nome)
  if (!tutor) throw new TutorNotFoundError(nome)
  return tutor
}

const nextId = (items: { id: number }[]) => Math.max(0, ...items.map((item) => item.id)) + 1

export function useDogs() {
  const [dogs, setDogs] = useState<Dog[]>([])

  const refresh = useCallback(async () => {
    try {
      const pets = await petService.listarPets()
      setDogs(pets.map(petToDog))
    } catch {
      setDogs([])
    }
  }, [])

  useEffect(() => {
    let active = true
    petService
      .listarPets()
      .then((pets) => {
        if (active) setDogs(pets.map(petToDog))
      })
      .catch(() => {
        if (active) setDogs([])
      })
    return () => {
      active = false
    }
  }, [])

  async function createDog(form: DogFormData) {
    const tutor = await findTutor(form.tutor)
    const pets = await petService.listarPets()
    const pet = new Pet(
      nextId(pets),
      form.name,
      'Cão',
      form.breed,
      tutor,
      [],
      form.age,
      form.weight,
      form.sex,
      form.history,
    )
    await petService.adicionarPet(pet)
    await refresh()
  }

  async function createTutor(form: TutorFormData) {
    const tutores = await tutorService.listarTutores()
    await tutorService.adicionarTutor(formToTutor(nextId(tutores), form))
  }

  async function updateDog(id: number, form: DogFormData) {
    await petService.atualizarPet(id, {
      nome: form.name,
      raca: form.breed,
      idade: form.age,
      peso: form.weight,
      sexo: form.sex,
      historico: form.history,
    })
    await refresh()
  }

  async function removeDog(id: number) {
    await petService.removerPet(id)
    await refresh()
  }

  return { dogs, createDog, createTutor, updateDog, removeDog }
}
