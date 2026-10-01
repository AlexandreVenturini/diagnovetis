import { describe, it, expect, beforeEach } from 'vitest'
import './setup'
import { Pet } from '../models/Pet'
import { Tutor } from '../models/Tutor'
import { Endereco } from '../models/Endereco'
import { PetService, PET_NAO_REMOVIVEL } from '../services/PetService'
import { TutorService } from '../services/TutorService'
import { ValidacaoError } from '../services/validation/ValidacaoError'

function criarTutor(id = 1): Tutor {
  return new Tutor(
    id,
    'Ana Costa',
    '27933001234',
    'ana@email.com',
    new Date('2024-01-01'),
    new Endereco('Rua A', 1, 'Bairro', 'Vitória', 'ES', '29010100'),
  )
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

  it('avisa quando o banco não remove o pet', async () => {
    await petService.adicionarPet(novoPet(tutor))
    await expect(petService.removerPet(99)).rejects.toThrow(PET_NAO_REMOVIVEL)
    expect(await petService.listarPets()).toHaveLength(1)
  })
})

describe('PetService.atualizarPet', () => {
  it('atualiza os dados do pet mantendo o tutor', async () => {
    await petService.adicionarPet(novoPet(tutor))
    await petService.atualizarPet(1, {
      nome: 'Rex II',
      raca: 'SRD',
      idade: '4 anos',
      peso: '20',
      sexo: 'Macho',
      historico: 'Vacinado',
    })
    const [pet] = await petService.listarPets()
    expect(pet.nome).toBe('Rex II')
    expect(pet.raca).toBe('SRD')
    expect(pet.tutor.id).toBe(tutor.id)
  })

  it('lança erro quando o nome fica vazio', async () => {
    await petService.adicionarPet(novoPet(tutor))
    await expect(
      petService.atualizarPet(1, { nome: '', raca: 'SRD', idade: '', peso: '', sexo: '', historico: '' }),
    ).rejects.toThrow(ValidacaoError)
  })
})
