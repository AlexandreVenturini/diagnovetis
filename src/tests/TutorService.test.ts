import { describe, it, expect, beforeEach } from 'vitest'
import './setup'
import { Tutor, NOME_SEM_RESPONSAVEL } from '../models/Tutor'
import { Endereco } from '../models/Endereco'
import { TutorService } from '../services/TutorService'
import { ValidacaoError } from '../services/validation/ValidacaoError'

function criarEndereco(): Endereco {
  return new Endereco('Rua das Flores', 100, 'Centro', 'Vitória', 'ES', '29010100')
}

function novoTutor(id = 1): Tutor {
  return new Tutor(id, 'Ana Costa', '27933001234', 'ana@email.com', new Date('2024-01-01'), criarEndereco())
}

let servico: TutorService

beforeEach(() => {
  servico = new TutorService()
})

describe('TutorService.adicionarTutor', () => {
  it('adiciona tutor válido com sucesso', async () => {
    await servico.adicionarTutor(novoTutor())
    expect(await servico.listarTutores()).toHaveLength(1)
  })

  it('lança erro para id duplicado', async () => {
    await servico.adicionarTutor(novoTutor(1))
    await expect(servico.adicionarTutor(novoTutor(1))).rejects.toThrow(ValidacaoError)
  })

  it('lança erro para nome vazio', async () => {
    const tutor = new Tutor(1, '', '27933001234', 'ana@email.com', new Date(), criarEndereco())
    await expect(servico.adicionarTutor(tutor)).rejects.toThrow(ValidacaoError)
  })

  it('lança erro para e-mail inválido', async () => {
    const tutor = new Tutor(1, 'Ana', '27933001234', 'email-invalido', new Date(), criarEndereco())
    await expect(servico.adicionarTutor(tutor)).rejects.toThrow(ValidacaoError)
  })

  it('lança erro para CEP inválido', async () => {
    const endereco = new Endereco('Rua A', 1, 'Bairro', 'Cidade', 'ES', '123')
    const tutor = new Tutor(1, 'Ana', '27933001234', 'ana@email.com', new Date(), endereco)
    await expect(servico.adicionarTutor(tutor)).rejects.toThrow(ValidacaoError)
  })
})

describe('TutorService.buscarPorNome', () => {
  it('encontra tutores pelo nome parcial', async () => {
    await servico.adicionarTutor(novoTutor(1))
    await servico.adicionarTutor(
      new Tutor(2, 'Carlos Souza', '27988880000', 'carlos@email.com', new Date(), criarEndereco()),
    )
    expect(await servico.buscarPorNome('ana')).toHaveLength(1)
  })
})

describe('TutorService.atualizarTutor', () => {
  it('atualiza tutor existente', async () => {
    await servico.adicionarTutor(novoTutor())
    const atualizado = new Tutor(
      1,
      'Ana Oliveira',
      '27933001234',
      'ana@email.com',
      new Date('2024-01-01'),
      criarEndereco(),
    )
    await servico.atualizarTutor(atualizado)
    expect((await servico.buscarPorId(1))?.nome).toBe('Ana Oliveira')
  })
})

describe('Tipos de responsável', () => {
  function instituicao(id = 1): Tutor {
    const tutor = new Tutor(id, 'ONG Patas', '27999990000', 'ong@patas.org', new Date(), criarEndereco())
    tutor.tipo = 'instituicao'
    tutor.cnpj = '12.345.678/0001-90'
    tutor.contato = 'Ana'
    return tutor
  }

  it('tutor antigo, sem tipo gravado, é pessoa física', async () => {
    await servico.adicionarTutor(novoTutor())
    const [tutor] = await servico.listarTutores()
    expect(tutor.tipo).toBe('pessoa')
  })

  it('instituição guarda CNPJ e pessoa de contato', async () => {
    await servico.adicionarTutor(instituicao())
    const salvo = await servico.buscarPorId(1)
    expect(salvo?.tipo).toBe('instituicao')
    expect(salvo?.cnpj).toBe('12.345.678/0001-90')
    expect(salvo?.contato).toBe('Ana')
  })

  it('instituição continua exigindo telefone e endereço', async () => {
    const semTelefone = instituicao()
    semTelefone.telefone = ''
    await expect(servico.adicionarTutor(semTelefone)).rejects.toThrow(ValidacaoError)
    const semEndereco = instituicao()
    semEndereco.endereco = null
    await expect(servico.adicionarTutor(semEndereco)).rejects.toThrow(ValidacaoError)
  })

  it('setor do IFES é criado uma vez e reaproveitado', async () => {
    const primeiro = await servico.obterSetorIfes('Bovinocultura')
    const segundo = await servico.obterSetorIfes('  bovinocultura ')
    expect(segundo.id).toBe(primeiro.id)
    expect(primeiro.nome).toBe('IFES - Campus Santa Teresa (Bovinocultura)')
    expect(primeiro.endereco).toBeNull()
    expect((await servico.listarTutores()).filter((t) => t.tipo === 'ifes')).toHaveLength(1)
  })

  it('setor do IFES é obrigatório', async () => {
    await expect(servico.obterSetorIfes('  ')).rejects.toThrow(ValidacaoError)
  })

  it('animal sem responsável ganha registro próprio com as observações', async () => {
    const primeiro = await servico.criarSemResponsavel('Resgatado na BR-259 por Ana')
    const segundo = await servico.criarSemResponsavel('')
    expect(primeiro.id).not.toBe(segundo.id)
    const salvo = await servico.buscarPorId(primeiro.id)
    expect(salvo?.nome).toBe(NOME_SEM_RESPONSAVEL)
    expect(salvo?.tipo).toBe('sem_responsavel')
    expect(salvo?.observacoes).toBe('Resgatado na BR-259 por Ana')
  })

  it('busca o responsável pelo nome exato e pelo tipo', async () => {
    await servico.adicionarTutor(novoTutor(1))
    await servico.adicionarTutor(instituicao(2))
    expect((await servico.buscarResponsavel('pessoa', ' ana costa '))?.id).toBe(1)
    expect(await servico.buscarResponsavel('pessoa', 'Ana')).toBeUndefined()
    expect(await servico.buscarResponsavel('pessoa', 'ONG Patas')).toBeUndefined()
    expect((await servico.buscarResponsavel('instituicao', 'ong patas'))?.id).toBe(2)
  })

  it('atualiza as observações de quem chegou sem responsável', async () => {
    const tutor = await servico.criarSemResponsavel('Resgatado')
    tutor.observacoes = 'Resgatado na feira, trazido pela Ana'
    await servico.atualizarTutor(tutor)
    expect((await servico.buscarPorId(tutor.id))?.observacoes).toBe('Resgatado na feira, trazido pela Ana')
  })
})
