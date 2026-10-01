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
  const dados = new Date()
  dados.setDate(dados.getDate() + dias)
  return dados
}

function novaConsulta(medico: Medico, pet: Pet, id = 1): Consulta {
  return new Consulta(id, dataFutura(), '09:00', 'Diagnóstico inicial', 'Nenhuma', medico, pet, criarDiagnostico())
}

let servico: ConsultaService
let tutorService: TutorService
let petService: PetService
let medico: Medico
let tutor: Tutor
let pet: Pet

beforeEach(async () => {
  servico = new ConsultaService()
  tutorService = new TutorService()
  petService = new PetService()

  medico = criarMedico()
  tutor = criarTutor()
  pet = criarPet(tutor)

  inserirMedico(medico)
  await tutorService.adicionarTutor(tutor)
  await petService.adicionarPet(pet)
})

type Opcoes = Parameters<ConsultaService['salvarAtendimento']>[1]

function salvar(consulta: Consulta, opcoes: Partial<Opcoes> = {}) {
  return servico.salvarAtendimento(consulta, {
    id: null,
    finalizar: true,
    participantes: [],
    agendamentoId: null,
    ...opcoes,
  })
}

describe('ConsultaService.salvarAtendimento', () => {
  it('salva o atendimento finalizado e devolve o id gerado', async () => {
    const id = await salvar(novaConsulta(medico, pet))
    expect(id).toBe(1)
    expect((await servico.buscarPorId(id))?.situacao).toBe('finalizado')
  })

  it('gera ids em sequência', async () => {
    expect(await salvar(novaConsulta(medico, pet))).toBe(1)
    expect(await salvar(novaConsulta(medico, pet))).toBe(2)
  })

  it('vincula consulta ao pet ao finalizar', async () => {
    const consulta = novaConsulta(medico, pet)
    await salvar(consulta)
    expect(pet.historicoConsulta).toHaveLength(1)
  })

  it('lança erro para data no passado em atendimento novo', async () => {
    const ontem = new Date()
    ontem.setDate(ontem.getDate() - 1)
    const consulta = new Consulta(0, ontem, '09:00', 'Diagnóstico', 'Nenhuma', medico, pet, criarDiagnostico())
    await expect(salvar(consulta)).rejects.toThrow(ValidacaoError)
  })

  it('aceita data antiga ao continuar um atendimento em andamento', async () => {
    const id = await salvar(novaConsulta(medico, pet), { finalizar: false })
    const ontem = new Date()
    ontem.setDate(ontem.getDate() - 1)
    const consulta = new Consulta(0, ontem, '09:00', 'Diagnóstico', 'Nenhuma', medico, pet, criarDiagnostico())
    await expect(salvar(consulta, { id, finalizar: false })).resolves.toBe(id)
  })

  it('lança erro para horário vazio', async () => {
    const consulta = new Consulta(0, dataFutura(), '', 'Diagnóstico', 'Nenhuma', medico, pet, criarDiagnostico())
    await expect(salvar(consulta)).rejects.toThrow(ValidacaoError)
  })

  it('aceita consulta para hoje', async () => {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const consulta = new Consulta(0, hoje, '09:00', 'Diagnóstico', 'Nenhuma', medico, pet, criarDiagnostico())
    await expect(salvar(consulta)).resolves.toBe(1)
  })
})

describe('Atendimento em andamento', () => {
  it('fica fora do prontuário até ser finalizado', async () => {
    const id = await salvar(novaConsulta(medico, pet), { finalizar: false })
    expect((await servico.buscarPorId(id))?.situacao).toBe('aberto')
    expect(await servico.listarPorPet(1)).toHaveLength(0)
    expect(await servico.listarResumo()).toHaveLength(0)
    expect(pet.historicoConsulta).toHaveLength(0)

    await salvar(novaConsulta(medico, pet), { id, finalizar: true })
    expect(await servico.listarPorPet(1)).toHaveLength(1)
    expect(await servico.listarResumo()).toHaveLength(1)
  })

  it('continua o mesmo atendimento ao salvar de novo', async () => {
    const id = await salvar(novaConsulta(medico, pet), { finalizar: false })
    const editada = new Consulta(
      0,
      dataFutura(),
      '09:00',
      'Diagnóstico revisado',
      'Nenhuma',
      medico,
      pet,
      criarDiagnostico(),
    )
    expect(await salvar(editada, { id, finalizar: false })).toBe(id)
    expect((await servico.buscarPorId(id))?.diagnostico).toBe('Diagnóstico revisado')
  })

  it('não altera atendimento já finalizado', async () => {
    const id = await salvar(novaConsulta(medico, pet))
    await expect(salvar(novaConsulta(medico, pet), { id, finalizar: false })).rejects.toThrow('já foi finalizado')
  })

  it('descarta atendimento em andamento e recusa descartar finalizado', async () => {
    const aberto = await salvar(novaConsulta(medico, pet), { finalizar: false })
    await servico.descartarAtendimento(aberto)
    expect(await servico.buscarPorId(aberto)).toBeUndefined()

    const finalizado = await salvar(novaConsulta(medico, pet))
    await expect(servico.descartarAtendimento(finalizado)).rejects.toThrow('em andamento')
  })
})

describe('ConsultaService.buscarPorId', () => {
  it('retorna consulta existente', async () => {
    const id = await salvar(novaConsulta(medico, pet))
    expect((await servico.buscarPorId(id))?.horario).toBe('09:00')
  })

  it('retorna undefined para id inexistente', async () => {
    expect(await servico.buscarPorId(99)).toBeUndefined()
  })
})

describe('ConsultaService.listarPorPet', () => {
  it('retorna consultas do pet correto', async () => {
    const tutor2 = criarTutor(2)
    const pet2 = criarPet(tutor2, 2)
    await tutorService.adicionarTutor(tutor2)
    await petService.adicionarPet(pet2)

    await salvar(novaConsulta(medico, pet))
    await salvar(new Consulta(0, dataFutura(2), '10:00', 'Diag', 'Obs', medico, pet2, criarDiagnostico()))

    expect(await servico.listarPorPet(1)).toHaveLength(1)
    expect(await servico.listarPorPet(2)).toHaveLength(1)
  })
})
