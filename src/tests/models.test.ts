import { describe, it, expect } from 'vitest'
import { Medico } from '../models/Medico'
import { Tutor } from '../models/Tutor'
import { Endereco } from '../models/Endereco'
import { Pet } from '../models/Pet'

function criarMedico(id = 1): Medico {
  return new Medico(id, 'Dr. Silva', '27933001234', 'silva@vet.com', 'Clínica Geral', '12345-ES')
}

function criarEndereco(): Endereco {
  return new Endereco('Rua das Flores', 100, 'Centro', 'Vitória', 'ES', '29010100')
}

function criarTutor(id = 1): Tutor {
  return new Tutor(id, 'Ana Costa', '27933001234', 'ana@email.com', new Date('2024-01-01'), criarEndereco())
}

function criarPet(tutor: Tutor, id = 1): Pet {
  return new Pet(id, 'Rex', 'Cão', 'Labrador', tutor)
}

describe('Medico', () => {
  it('cria médico com os dados corretos', () => {
    const medico = criarMedico()
    expect(medico.id).toBe(1)
    expect(medico.nome).toBe('Dr. Silva')
    expect(medico.especialidade).toBe('Clínica Geral')
    expect(medico.crmv).toBe('12345-ES')
  })

  it('temEspecialidade retorna true quando tem especialidade', () => {
    expect(criarMedico().temEspecialidade()).toBe(true)
  })

  it('temEspecialidade retorna false quando especialidade está vazia', () => {
    const medico = new Medico(1, 'Dr. Silva', '27933001234', 'silva@vet.com', '', '12345-ES')
    expect(medico.temEspecialidade()).toBe(false)
  })

  it('toString retorna nome e CRMV', () => {
    expect(criarMedico().toString()).toBe('Dr. Silva - CRMV 12345-ES')
  })

  it('permite alterar especialidade via setter', () => {
    const medico = criarMedico()
    medico.especialidade = 'Cirurgia'
    expect(medico.especialidade).toBe('Cirurgia')
  })
})

describe('Endereco', () => {
  it('cria endereço com todos os campos', () => {
    const endereco = criarEndereco()
    expect(endereco.rua).toBe('Rua das Flores')
    expect(endereco.numero).toBe(100)
    expect(endereco.cidade).toBe('Vitória')
    expect(endereco.uf).toBe('ES')
    expect(endereco.cep).toBe('29010100')
  })
})

describe('Tutor', () => {
  it('cria tutor sem pets inicialmente', () => {
    expect(criarTutor().pets).toHaveLength(0)
  })

  it('adicionarPet inclui o pet na lista', () => {
    const tutor = criarTutor()
    const pet = criarPet(tutor)
    tutor.adicionarPet(pet)
    expect(tutor.pets).toHaveLength(1)
    expect(tutor.pets[0].nome).toBe('Rex')
  })

  it('adicionarPet não duplica o mesmo pet', () => {
    const tutor = criarTutor()
    const pet = criarPet(tutor)
    tutor.adicionarPet(pet)
    tutor.adicionarPet(pet)
    expect(tutor.pets).toHaveLength(1)
  })

  it('removerPet remove o pet da lista', () => {
    const tutor = criarTutor()
    const pet = criarPet(tutor)
    tutor.adicionarPet(pet)
    tutor.removerPet(pet)
    expect(tutor.pets).toHaveLength(0)
  })

  it('pets retorna cópia da lista (imutabilidade)', () => {
    const tutor = criarTutor()
    const lista = tutor.pets
    lista.push(criarPet(tutor))
    expect(tutor.pets).toHaveLength(0)
  })
})

describe('Pet', () => {
  it('cria pet com campos obrigatórios', () => {
    const tutor = criarTutor()
    const pet = criarPet(tutor)
    expect(pet.id).toBe(1)
    expect(pet.nome).toBe('Rex')
    expect(pet.especie).toBe('Cão')
    expect(pet.raca).toBe('Labrador')
    expect(pet.tutor).toBe(tutor)
  })

  it('campos opcionais iniciam como string vazia', () => {
    const pet = criarPet(criarTutor())
    expect(pet.idade).toBe('')
    expect(pet.peso).toBe('')
    expect(pet.sexo).toBe('')
    expect(pet.historico).toBe('')
  })

  it('aceita campos opcionais no construtor', () => {
    const tutor = criarTutor()
    const pet = new Pet(1, 'Rex', 'Cão', 'Labrador', tutor, [], '3 anos', '25kg', 'Macho', 'Vacinado')
    expect(pet.idade).toBe('3 anos')
    expect(pet.peso).toBe('25kg')
    expect(pet.sexo).toBe('Macho')
    expect(pet.historico).toBe('Vacinado')
  })

  it('historicoConsulta retorna cópia da lista (imutabilidade)', () => {
    const pet = criarPet(criarTutor())
    const lista = pet.historicoConsulta
    lista.push({} as never)
    expect(pet.historicoConsulta).toHaveLength(0)
  })
})
