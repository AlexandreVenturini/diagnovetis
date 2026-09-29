import { describe, it, expect, beforeEach } from 'vitest'
import { inserirMedico } from './setup'
import { Consulta } from '../models/Consulta'
import { DiagnosticoZoonose } from '../models/DiagnosticoZoonose'
import { Endereco } from '../models/Endereco'
import { Exame } from '../models/Exame'
import { Medico } from '../models/Medico'
import { Pet } from '../models/Pet'
import { Tutor } from '../models/Tutor'
import { ConsultaService } from '../services/ConsultaService'
import { ExameService } from '../services/ExameService'
import { PetService } from '../services/PetService'
import { TutorService } from '../services/TutorService'

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

function criarExame(id = 1): Exame {
  return new Exame(id, 'Hemograma', new Date(), 'Normal')
}

function dataFutura(dias = 1): Date {
  const data = new Date()
  data.setDate(data.getDate() + dias)
  return data
}

function criarConsulta(medico: Medico, pet: Pet, id = 1, exames: Exame[] = []): Consulta {
  return new Consulta(
    id,
    dataFutura(),
    '09:00',
    'Diagnóstico',
    'Obs',
    medico,
    pet,
    new DiagnosticoZoonose('negativo', 'Sem sinais', new Date()),
    exames,
  )
}

let exameService: ExameService
let consultaService: ConsultaService
let medico: Medico
let tutor: Tutor
let pet: Pet

beforeEach(async () => {
  exameService = new ExameService()
  consultaService = new ConsultaService()
  const tutorService = new TutorService()
  const petService = new PetService()

  medico = criarMedico()
  tutor = criarTutor()
  pet = criarPet(tutor)

  inserirMedico(medico)
  await tutorService.adicionarTutor(tutor)
  await petService.adicionarPet(pet)
})

describe('ExameService', () => {
  it('listarPorConsulta retorna exames da consulta', async () => {
    const consulta = criarConsulta(medico, pet, 1, [criarExame(1), criarExame(2)])
    await consultaService.adicionarConsulta(consulta)
    expect(await exameService.listarPorConsulta(1)).toHaveLength(2)
  })

  it('listarPorConsulta retorna lista vazia para consulta sem exames', async () => {
    const consulta = criarConsulta(medico, pet, 1, [])
    await consultaService.adicionarConsulta(consulta)
    expect(await exameService.listarPorConsulta(1)).toHaveLength(0)
  })

  it('listarPorConsulta retorna lista vazia para consulta inexistente', async () => {
    expect(await exameService.listarPorConsulta(99)).toHaveLength(0)
  })

  it('buscarPorId encontra exame pelo id', async () => {
    await consultaService.adicionarConsulta(criarConsulta(medico, pet, 1, [criarExame(42)]))
    expect((await exameService.buscarPorId(42))?.nomeExame).toBe('Hemograma')
  })

  it('buscarPorId retorna undefined para id inexistente', async () => {
    expect(await exameService.buscarPorId(99)).toBeUndefined()
  })

  it('listarPorPet retorna exames do pet correto', async () => {
    const tutor2 = criarTutor(2)
    const pet2 = criarPet(tutor2, 2)
    const tutorService = new TutorService()
    const petService = new PetService()
    await tutorService.adicionarTutor(tutor2)
    await petService.adicionarPet(pet2)

    await consultaService.adicionarConsulta(criarConsulta(medico, pet, 1, [criarExame(1)]))
    await consultaService.adicionarConsulta(criarConsulta(medico, pet2, 2, [criarExame(2)]))

    expect(await exameService.listarPorPet(1)).toHaveLength(1)
    expect(await exameService.listarPorPet(2)).toHaveLength(1)
  })
})

describe('Exame model', () => {
  it('cria exame com dados corretos', () => {
    const data = new Date('2025-01-01')
    const exame = new Exame(1, 'Hemograma', data, 'Normal')
    expect(exame.id).toBe(1)
    expect(exame.nomeExame).toBe('Hemograma')
    expect(exame.dataExame).toEqual(data)
    expect(exame.resultado).toBe('Normal')
  })

  it('permite alterar resultado via setter', () => {
    const exame = criarExame()
    exame.resultado = 'Alterado'
    expect(exame.resultado).toBe('Alterado')
  })
})

describe('Exames complementares no atendimento', () => {
  it('salva solicitações sem resultado e preserva o vínculo com a consulta', async () => {
    const { newExam } = await import('../features/consultations/examTypes')
    const exams = exameService.criarSolicitacoes([
      newExam('Hemograma', 'laboratorial'),
      newExam('Radiografia', 'imagem'),
    ])
    await consultaService.adicionarConsulta(criarConsulta(medico, pet, 1, exams))
    const saved = await exameService.listarPorConsulta(1)
    expect(saved).toHaveLength(2)
    expect(
      saved.every(
        (exam) =>
          exam.consultaId === 1 &&
          exam.id > 0 &&
          exam.status === 'solicitado' &&
          !exam.resultado &&
          !exam.dataRealizacao,
      ),
    ).toBe(true)
    expect(saved.map((exam) => exam.categoria)).toEqual(['laboratorial', 'imagem'])
  })

  it('registra o resultado dias depois sem alterar os outros dados da consulta', async () => {
    const { newExam, examToDraft, localDate } = await import('../features/consultations/examTypes')
    const draft = {
      ...newExam('Hemograma', 'laboratorial'),
      dataSolicitacao: '2025-01-01',
      laudo: 'Laudo inicial',
      laudoAnexo: { nome: 'exame.pdf', tipo: 'application/pdf', dados: 'data:application/pdf;base64,JVBERi0xLjc=' },
    }
    await consultaService.adicionarConsulta(criarConsulta(medico, pet, 1, exameService.criarSolicitacoes([draft])))
    const before = await consultaService.buscarPorId(1)
    const [exam] = await exameService.listarPorConsulta(1)
    expect(exam.laudo).toBe('Laudo inicial')
    expect(exam.laudoAnexo).toEqual(draft.laudoAnexo)
    await exameService.atualizarResultado(exam, {
      ...examToDraft(exam),
      status: 'concluido',
      dataRealizacao: localDate(),
      resultado: 'Resultado cadastrado',
      laudo: 'Laudo revisado',
      interpretacao: 'Interpretação registrada',
    })
    const after = await consultaService.buscarPorId(1)
    expect(after?.diagnostico).toBe(before?.diagnostico)
    expect(after?.observacoes).toBe(before?.observacoes)
    expect(after?.responsavel.id).toBe(before?.responsavel.id)
    expect(after?.exames[0].laudo).toBe('Laudo revisado')
    expect(after?.exames[0].laudoAnexo).toEqual(draft.laudoAnexo)
    await exameService.atualizarResultado(after!.exames[0], { ...examToDraft(after!.exames[0]), laudoAnexo: null })
    expect((await exameService.buscarPorId(exam.id))?.laudoAnexo).toBeNull()
    expect(after?.exames[0].status).toBe('concluido')
    expect(after?.exames[0].interpretacao).toBe('Interpretação registrada')
    expect(after?.exames[0].dataSolicitacao.getFullYear()).toBe(2025)
  })

  it('não deixa uma segunda consulta salva quando um exame da transação falha', async () => {
    await consultaService.adicionarConsulta(criarConsulta(medico, pet, 1, [criarExame(42)]))
    await expect(consultaService.adicionarConsulta(criarConsulta(medico, pet, 2, [criarExame(42)]))).rejects.toThrow(
      'exames',
    )
    expect(await consultaService.buscarPorId(2)).toBeUndefined()
    expect(await exameService.listarPorConsulta(1)).toHaveLength(1)
    expect(await exameService.listarPorConsulta(2)).toHaveLength(0)
  })

  it('mantém o resultado salvo quando uma atualização inválida é rejeitada', async () => {
    const { newExam, examToDraft } = await import('../features/consultations/examTypes')
    await consultaService.adicionarConsulta(
      criarConsulta(medico, pet, 1, exameService.criarSolicitacoes([newExam('PCR', 'laboratorial')])),
    )
    const [exam] = await exameService.listarPorConsulta(1)
    await expect(exameService.atualizarResultado(exam, { ...examToDraft(exam), status: 'concluido' })).rejects.toThrow(
      'resultado',
    )
    expect((await exameService.buscarPorId(exam.id))?.status).toBe('solicitado')
  })
})
