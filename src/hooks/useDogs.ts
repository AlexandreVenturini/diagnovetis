import { useCallback, useEffect, useState } from 'react'
import type { Dog, DogFormData } from '../features/dogs/dogTypes'
import type { TutorFormData } from '../features/tutors/tutorTypes'
import { Pet } from '../models/Pet'
import { Tutor } from '../models/Tutor'
import { Endereco } from '../models/Endereco'
import { PetService } from '../services/PetService'
import { TutorService } from '../services/TutorService'
import { petRepository } from '../services/PetService'

const petService = new PetService()
const tutorService = new TutorService()

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
    }
}

async function getOrCreateTutor(nome: string): Promise<Tutor> {
    const encontrados = await tutorService.buscarPorNome(nome)
    if (encontrados.length > 0) return encontrados[0]

    throw new TutorNotFoundError(nome)
}

export class TutorNotFoundError extends Error {
    constructor(nome: string) {
        super(`Tutor '${nome}' não encontrado. Cadastre o tutor completo antes de registrar o cão.`)
        this.name = 'TutorNotFoundError'
    }
}

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

    useEffect(() => { refresh() }, [refresh])

    async function createDog(form: DogFormData) {
        const tutor = await getOrCreateTutor(form.tutor)
        const pets = await petService.listarPets()
        const novoId = pets.length > 0 ? Math.max(...pets.map(p => p.id)) + 1 : 1
        const pet = new Pet(novoId, form.name, 'Cão', form.breed, tutor, [], form.age, form.weight, form.sex, form.history)
        await petService.adicionarPet(pet)
        await refresh()
    }

    async function createTutor(form: TutorFormData) {
        const tutores = await tutorService.listarTutores()
        const novoId = tutores.length > 0 ? Math.max(...tutores.map(t => t.id)) + 1 : 1
        const tutor = new Tutor(
            novoId,
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
        )
        await tutorService.adicionarTutor(tutor)
    }

    async function updateDog(id: number, form: DogFormData) {
        const pet = await petRepository.getById(id)
        if (!pet) return
        const atualizado = new Pet(id, form.name, 'Cão', form.breed, pet.tutor, [], form.age, form.weight, form.sex, form.history)
        await petRepository.update(atualizado)
        await refresh()
    }

    async function removeDog(id: number) {
        await petService.removerPet(id)
        await refresh()
    }

    return { dogs, createDog, createTutor, updateDog, removeDog }
}
