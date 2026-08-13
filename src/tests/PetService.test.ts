import { describe, it, expect, beforeEach } from 'vitest'
import './setup'
import { Pet } from '../models/Pet'
import { Tutor } from '../models/Tutor'
import { Endereco } from '../models/Endereco'
import { PetService } from '../services/PetService'
import { TutorService } from '../services/TutorService'
import { ValidacaoError } from '../services/validation/ValidacaoError'

function criarTutor(id = 1): Tutor {
    return new Tutor(id, 'Ana Costa', '27933001234', 'ana@email.com', new Date('2024-01-01'), new Endereco('Rua A', 1, 'Bairro', 'Vitória', 'ES', '29010100'))
}

function novoPet(tutor: Tutor, id = 1): Pet {
    return new Pet(id, 'Rex', 'Cão', 'Labrador', tutor)
}

let petService: PetService
let tutorService: TutorService
let tutor: Tutor

beforeEach(async () => {
    petService = new PetService()
    tutorService = new TutorService()
    tutor = criarTutor()
    await tutorService.adicionarTutor(tutor)
})

describe('PetService.adicionarPet', () => {
    it('adiciona pet válido com sucesso', async () => {
        await petService.adicionarPet(novoPet(tutor))
        expect(await petService.listarPets()).toHaveLength(1)
    })

    it('vincula pet ao tutor após adicionar', async () => {
        const pet = novoPet(tutor)
        await petService.adicionarPet(pet)
        expect(tutor.pets).toHaveLength(1)
    })

    it('lança erro para id duplicado', async () => {
        await petService.adicionarPet(novoPet(tutor, 1))
        await expect(petService.adicionarPet(novoPet(tutor, 1))).rejects.toThrow(ValidacaoError)
    })

    it('lança erro para nome vazio', async () => {
        const pet = new Pet(1, '', 'Cão', 'Labrador', tutor)
        await expect(petService.adicionarPet(pet)).rejects.toThrow(ValidacaoError)
    })

    it('lança erro para espécie vazia', async () => {
        const pet = new Pet(1, 'Rex', '', 'Labrador', tutor)
        await expect(petService.adicionarPet(pet)).rejects.toThrow(ValidacaoError)
    })

    it('lança erro para raça vazia', async () => {
        const pet = new Pet(1, 'Rex', 'Cão', '', tutor)
        await expect(petService.adicionarPet(pet)).rejects.toThrow(ValidacaoError)
    })
})

describe('PetService.listarPorTutor', () => {
    it('lista pets de um tutor específico', async () => {
        const tutor2 = new Tutor(2, 'Bruno', '27988880000', 'bruno@email.com', new Date(), new Endereco('Rua B', 2, 'Bairro', 'Vila Velha', 'ES', '29100100'))
        await tutorService.adicionarTutor(tutor2)
        await petService.adicionarPet(novoPet(tutor, 1))
        await petService.adicionarPet(new Pet(2, 'Luna', 'Gato', 'Siamês', tutor2))
        expect(await petService.listarPorTutor(1)).toHaveLength(1)
        expect(await petService.listarPorTutor(2)).toHaveLength(1)
    })
})

describe('PetService.listarPorEspecie', () => {
    it('filtra pets pela espécie', async () => {
        const tutor2 = new Tutor(2, 'Bruno', '27988880000', 'bruno@email.com', new Date(), new Endereco('Rua B', 2, 'Bairro', 'Vila Velha', 'ES', '29100100'))
        await tutorService.adicionarTutor(tutor2)
        await petService.adicionarPet(novoPet(tutor, 1))
        await petService.adicionarPet(new Pet(2, 'Luna', 'Gato', 'Siamês', tutor2))
        expect(await petService.listarPorEspecie('Cão')).toHaveLength(1)
    })
})

describe('PetService.buscarPorNome', () => {
    it('encontra pet pelo nome parcial', async () => {
        await petService.adicionarPet(novoPet(tutor))
        expect(await petService.buscarPorNome('rex')).toHaveLength(1)
    })
})

describe('PetService.removerPet', () => {
    it('remove pet existente', async () => {
        await petService.adicionarPet(novoPet(tutor))
        await petService.removerPet(1)
        expect(await petService.listarPets()).toHaveLength(0)
    })
})
