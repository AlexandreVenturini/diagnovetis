import { useCallback, useEffect, useState } from 'react'
import type { Dog, DogFormData } from '../features/dogs/dogTypes'
import { Pet } from '../models/Pet'
import { Tutor } from '../models/Tutor'
import { Endereco } from '../models/Endereco'
import { PetService } from '../services/PetService'
import { TutorService } from '../services/TutorService'
import { petRepository } from '../services/PetService'
import { isSupabaseConfigured } from '../services/storage/supabaseClient'

const petService = new PetService()
const tutorService = new TutorService()
const LOCAL_STORAGE_KEY = 'diagnovetis:dogs'

function loadLocalDogs(): Dog[] {
    if (typeof localStorage === 'undefined') return []
    try { return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) ?? '[]') as Dog[] } catch { return [] }
}

function saveLocalDogs(dogs: Dog[]) {
    if (typeof localStorage !== 'undefined') localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dogs))
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
    }
}

async function getOrCreateTutor(nome: string, contact: string): Promise<Tutor> {
    const encontrados = await tutorService.buscarPorNome(nome)
    if (encontrados.length > 0) return encontrados[0]

    const tutores = await tutorService.listarTutores()
    const novoId = tutores.length > 0 ? Math.max(...tutores.map(t => t.id)) + 1 : 1
    const tutor = new Tutor(
        novoId, nome, contact, '', new Date(),
        new Endereco('', 0, '', '', '', '00000000')
    )
    await tutorService.adicionarTutor(tutor)
    return tutor
}

export function useDogs() {
    const [dogs, setDogs] = useState<Dog[]>([])

    const refresh = useCallback(async () => {
        if (!isSupabaseConfigured) { setDogs(loadLocalDogs()); return }
        try {
            const pets = await petService.listarPets()
            setDogs(pets.map(petToDog))
        } catch {
            setDogs(loadLocalDogs())
        }
    }, [])

    useEffect(() => { refresh() }, [refresh])

    async function createDog(form: DogFormData) {
        if (!isSupabaseConfigured) {
            const current = loadLocalDogs()
            const dog: Dog = { ...form, id: Math.max(0, ...current.map(item => item.id)) + 1 }
            saveLocalDogs([...current, dog]); setDogs([...current, dog]); return
        }
        const tutor = await getOrCreateTutor(form.tutor, form.contact)
        const pets = await petService.listarPets()
        const novoId = pets.length > 0 ? Math.max(...pets.map(p => p.id)) + 1 : 1
        const pet = new Pet(novoId, form.name, 'Cão', form.breed, tutor, [], form.age, form.weight, form.sex, form.history)
        await petService.adicionarPet(pet)
        await refresh()
    }

    async function updateDog(id: number, form: DogFormData) {
        if (!isSupabaseConfigured) {
            const updated = loadLocalDogs().map(item => item.id === id ? { ...form, id } : item)
            saveLocalDogs(updated); setDogs(updated); return
        }
        const pet = await petRepository.getById(id)
        if (!pet) return
        const atualizado = new Pet(id, form.name, 'Cão', form.breed, pet.tutor, [], form.age, form.weight, form.sex, form.history)
        await petRepository.update(atualizado)
        await refresh()
    }

    async function removeDog(id: number) {
        if (!isSupabaseConfigured) {
            const updated = loadLocalDogs().filter(item => item.id !== id)
            saveLocalDogs(updated); setDogs(updated); return
        }
        await petService.removerPet(id)
        await refresh()
    }

    return { dogs, createDog, updateDog, removeDog }
}
