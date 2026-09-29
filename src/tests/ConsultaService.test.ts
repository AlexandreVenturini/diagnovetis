import { describe, it, expect, beforeEach } from 'vitest'
import { inserirMedico } from './setup'
import { Consulta } from '../models/Consulta'
import { DiagnosticoZoonose } from '../models/DiagnosticoZoonose'
import { Endereco } from '../models/Endereco'
import { Medico } from '../models/Medico'
import { Pet } from '../models/Pet'
import { Tutor } from '../models/Tutor'
import { ConsultaService } from '../services/ConsultaService'
import { TutorService } from '../services/TutorService'
import { PetService } from '../services/PetService'
import { ValidacaoError } from '../services/validation/ValidacaoError'

function criarMedico(id = 1): Medico {
  return new Medico(id, 'Dr. Silva', '27933001234', 'silva@vet.com', 'Clínica Geral', '12345-ES')
}

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

function criarPet(tutor: Tutor, id = 1): Pet {
  return new Pet(id, 'Rex', 'Cão', 'Labrador', tutor)
}

function criarDiagnostico(): DiagnosticoZoonose {
  return new DiagnosticoZoonose('negativo', 'Sem sinais', new Date())
}

function dataFutura(dias = 1): Date {
  const data = new Date()
  data.setDate(data.getDate() + dias)
  return data
}

function novaConsulta(medico: Medico, pet: Pet, id = 1): Consulta {
  return new Consulta(id, dataFutura(), '09:00', 'Diagnóstico inicial', 'Nenhuma', medico, pet, criarDiagnostico())
}

let service: ConsultaService
let tutorService: TutorService
let petService: PetService
let medico: Medico
let tutor: Tutor
let pet: Pet

beforeEach(async () => {
  service = new ConsultaService()
  tutorService = new TutorService()
  petService = new PetService()

  medico = criarMedico()
  tutor = criarTutor()
  pet = criarPet(tutor)

  inserirMedico(medico)
  await tutorService.adicionarTutor(tutor)
  await petService.adicionarPet(pet)
})

describe('ConsultaService.adicionarConsulta', () => {
  it('adiciona consulta válida com sucesso', async () => {
    await service.adicionarConsulta(novaConsulta(medico, pet))
    expect(await service.buscarPorId(1)).toBeDefined()
  })

  it('vincula consulta ao pet após adicionar', async () => {
    const consulta = novaConsulta(medico, pet)
    await service.adicionarConsulta(consulta)
    expect(pet.historicoConsulta).toHaveLength(1)
  })

  it('lança erro para id duplicado', async () => {
    await service.adicionarConsulta(novaConsulta(medico, pet, 1))
    await expect(service.adicionarConsulta(novaConsulta(medico, pet, 1))).rejects.toThrow(ValidacaoError)
  })

  it('lança erro para data no passado', async () => {
    const ontem = new Date()
    ontem.setDate(ontem.getDate() - 1)
    const consulta = new Consulta(1, ontem, '09:00', 'Diagnóstico', 'Nenhuma', medico, pet, criarDiagnostico())
    await expect(service.adicionarConsulta(consulta)).rejects.toThrow(ValidacaoError)
  })

  it('lança erro para horário vazio', async () => {
    const consulta = new Consulta(1, dataFutura(), '', 'Diagnóstico', 'Nenhuma', medico, pet, criarDiagnostico())
    await expect(service.adicionarConsulta(consulta)).rejects.toThrow(ValidacaoError)
  })

  it('aceita consulta para hoje', async () => {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const consulta = new Consulta(1, hoje, '09:00', 'Diagnóstico', 'Nenhuma', medico, pet, criarDiagnostico())
    await expect(service.adicionarConsulta(consulta)).resolves.not.toThrow()
  })
})

describe('ConsultaService.buscarPorId', () => {
  it('retorna consulta existente', async () => {
    await service.adicionarConsulta(novaConsulta(medico, pet))
    expect((await service.buscarPorId(1))?.horario).toBe('09:00')
  })

  it('retorna undefined para id inexistente', async () => {
    expect(await service.buscarPorId(99)).toBeUndefined()
  })
})

describe('ConsultaService.listarPorPet', () => {
  it('retorna consultas do pet correto', async () => {
    const tutor2 = criarTutor(2)
    const pet2 = criarPet(tutor2, 2)
    await tutorService.adicionarTutor(tutor2)
    await petService.adicionarPet(pet2)

    await service.adicionarConsulta(novaConsulta(medico, pet, 1))
    await service.adicionarConsulta(
      new Consulta(2, dataFutura(2), '10:00', 'Diag', 'Obs', medico, pet2, criarDiagnostico()),
    )

    expect(await service.listarPorPet(1)).toHaveLength(1)
    expect(await service.listarPorPet(2)).toHaveLength(1)
  })
})
