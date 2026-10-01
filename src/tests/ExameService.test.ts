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
  const dados = new Date()
  dados.setDate(dados.getDate() + dias)
  return dados
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

function salvarFinalizado(consulta: Consulta) {
  return consultaService.salvarAtendimento(consulta, {
    id: null,
    finalizar: true,
    participantes: [],
    agendamentoId: null,
  })
}

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
    await salvarFinalizado(consulta)
    expect(await exameService.listarPorConsulta(1)).toHaveLength(2)
  })

  it('listarPorConsulta retorna lista vazia para consulta sem exames', async () => {
    const consulta = criarConsulta(medico, pet, 1, [])
    await salvarFinalizado(consulta)
    expect(await exameService.listarPorConsulta(1)).toHaveLength(0)
  })

  it('listarPorConsulta retorna lista vazia para consulta inexistente', async () => {
    expect(await exameService.listarPorConsulta(99)).toHaveLength(0)
  })

  it('buscarPorId encontra exame pelo id', async () => {
    await salvarFinalizado(criarConsulta(medico, pet, 1, [criarExame(42)]))
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

    await salvarFinalizado(criarConsulta(medico, pet, 1, [criarExame(1)]))
    await salvarFinalizado(criarConsulta(medico, pet2, 2, [criarExame(2)]))

    expect(await exameService.listarPorPet(1)).toHaveLength(1)
    expect(await exameService.listarPorPet(2)).toHaveLength(1)
  })
})

describe('Exame model', () => {
  it('cria exame com dados corretos', () => {
    const dados = new Date('2025-01-01')
    const exame = new Exame(1, 'Hemograma', dados, 'Normal')
    expect(exame.id).toBe(1)
    expect(exame.nomeExame).toBe('Hemograma')
    expect(exame.dataExame).toEqual(dados)
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
    const { novoExame } = await import('../features/atendimentos/exameTipos')
    const exames = exameService.criarSolicitacoes([
      novoExame('Hemograma', 'laboratorial'),
      novoExame('Radiografia', 'imagem'),
    ])
    await salvarFinalizado(criarConsulta(medico, pet, 1, exames))
    const salvo = await exameService.listarPorConsulta(1)
    expect(salvo).toHaveLength(2)
    expect(
      salvo.every(
        (exame) =>
          exame.consultaId === 1 &&
          exame.id > 0 &&
          exame.status === 'solicitado' &&
          !exame.resultado &&
          !exame.dataRealizacao,
      ),
    ).toBe(true)
    expect(salvo.map((exame) => exame.categoria)).toEqual(['laboratorial', 'imagem'])
  })

  it('registra o resultado dias depois sem alterar os outros dados da consulta', async () => {
    const { novoExame, exameParaRascunho, dataLocal } = await import('../features/atendimentos/exameTipos')
    const rascunho = {
      ...novoExame('Hemograma', 'laboratorial'),
      dataSolicitacao: '2025-01-01',
      laudo: 'Laudo inicial',
      laudoAnexo: { nome: 'exame.pdf', tipo: 'application/pdf', dados: 'data:application/pdf;base64,JVBERi0xLjc=' },
    }
    await salvarFinalizado(criarConsulta(medico, pet, 1, exameService.criarSolicitacoes([rascunho])))
    const antes = await consultaService.buscarPorId(1)
    const [exame] = await exameService.listarPorConsulta(1)
    expect(exame.laudo).toBe('Laudo inicial')
    expect(exame.laudoAnexo).toEqual(rascunho.laudoAnexo)
    await exameService.atualizarResultado(exame, {
      ...exameParaRascunho(exame),
      status: 'concluido',
      dataRealizacao: dataLocal(),
      resultado: 'Resultado cadastrado',
      laudo: 'Laudo revisado',
      interpretacao: 'Interpretação registrada',
    })
    const depois = await consultaService.buscarPorId(1)
    expect(depois?.diagnostico).toBe(antes?.diagnostico)
    expect(depois?.observacoes).toBe(antes?.observacoes)
    expect(depois?.responsavel.id).toBe(antes?.responsavel.id)
    expect(depois?.exames[0].laudo).toBe('Laudo revisado')
    expect(depois?.exames[0].laudoAnexo).toEqual(rascunho.laudoAnexo)
    await exameService.atualizarResultado(depois!.exames[0], {
      ...exameParaRascunho(depois!.exames[0]),
      laudoAnexo: null,
    })
    expect((await exameService.buscarPorId(exame.id))?.laudoAnexo).toBeNull()
    expect(depois?.exames[0].status).toBe('concluido')
    expect(depois?.exames[0].interpretacao).toBe('Interpretação registrada')
    expect(depois?.exames[0].dataSolicitacao.getFullYear()).toBe(2025)
  })

  it('não deixa uma segunda consulta salva quando um exame da transação falha', async () => {
    await salvarFinalizado(criarConsulta(medico, pet, 1, [criarExame(42)]))
    await expect(salvarFinalizado(criarConsulta(medico, pet, 2, [criarExame(42)]))).rejects.toThrow('exames')
    expect(await consultaService.buscarPorId(2)).toBeUndefined()
    expect(await exameService.listarPorConsulta(1)).toHaveLength(1)
    expect(await exameService.listarPorConsulta(2)).toHaveLength(0)
  })

  it('mantém o resultado salvo quando uma atualização inválida é rejeitada', async () => {
    const { novoExame, exameParaRascunho } = await import('../features/atendimentos/exameTipos')
    await salvarFinalizado(
      criarConsulta(medico, pet, 1, exameService.criarSolicitacoes([novoExame('PCR', 'laboratorial')])),
    )
    const [exame] = await exameService.listarPorConsulta(1)
    await expect(
      exameService.atualizarResultado(exame, { ...exameParaRascunho(exame), status: 'concluido' }),
    ).rejects.toThrow('resultado')
    expect((await exameService.buscarPorId(exame.id))?.status).toBe('solicitado')
  })
})
