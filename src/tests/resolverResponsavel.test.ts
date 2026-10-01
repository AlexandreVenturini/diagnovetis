import { describe, it, expect } from 'vitest'
import './setup'
import { Tutor } from '../models/Tutor'
import { Endereco } from '../models/Endereco'
import { TutorService } from '../services/TutorService'
import { PET_VAZIO } from '../features/pets/petVazio'
import type { DadosFormularioPet } from '../features/pets/petTipos'
import { resolverResponsavel, TutorNaoEncontradoError } from '../features/pets/resolverResponsavel'

const servico = new TutorService()

function formulario(dados: Partial<DadosFormularioPet>): DadosFormularioPet {
  return { ...PET_VAZIO, nome: 'Rex', raca: 'SRD', ...dados }
}

async function cadastrarPessoa(id: number, nome: string): Promise<Tutor> {
  const endereco = new Endereco('Rua A', 1, 'Centro', 'Santa Teresa', 'ES', '29650000')
  const tutor = new Tutor(id, nome, '27999990000', 'pessoa@email.com', new Date(), endereco)
  await servico.adicionarTutor(tutor)
  return tutor
}

describe('resolverResponsavel', () => {
  it('pessoa física já cadastrada é encontrada pelo nome', async () => {
    await cadastrarPessoa(1, 'Maria Silva')
    const tutor = await resolverResponsavel(formulario({ tutor: 'maria silva' }))
    expect(tutor.id).toBe(1)
  })

  it('pessoa física não cadastrada pede o cadastro completo', async () => {
    await cadastrarPessoa(1, 'Maria Silva')
    await expect(resolverResponsavel(formulario({ tutor: 'Maria' }))).rejects.toThrow(TutorNaoEncontradoError)
  })

  it('animal do IFES usa o setor informado', async () => {
    const tutor = await resolverResponsavel(formulario({ tipoResponsavel: 'ifes', setor: 'Bovinocultura' }))
    expect(tutor.tipo).toBe('ifes')
    expect(tutor.nome).toBe('IFES - Campus Santa Teresa (Bovinocultura)')
  })

  it('animal sem responsável cria um registro com as observações', async () => {
    const tutor = await resolverResponsavel(
      formulario({ tipoResponsavel: 'sem_responsavel', observacoesResponsavel: 'Resgatado na praça' }),
    )
    expect(tutor.tipo).toBe('sem_responsavel')
    expect(tutor.observacoes).toBe('Resgatado na praça')
  })

  it('na edição mantém o mesmo responsável mesmo com outro de nome igual', async () => {
    await cadastrarPessoa(1, 'Maria Silva')
    const atual = await cadastrarPessoa(2, 'Maria Silva')
    const tutor = await resolverResponsavel(formulario({ tutor: 'Maria Silva' }), atual)
    expect(tutor.id).toBe(2)
  })

  it('na edição atualiza as observações sem criar outro registro', async () => {
    const atual = await servico.criarSemResponsavel('Resgatado')
    const tutor = await resolverResponsavel(
      formulario({ tipoResponsavel: 'sem_responsavel', observacoesResponsavel: 'Resgatado e trazido pela Ana' }),
      atual,
    )
    expect(tutor.id).toBe(atual.id)
    expect((await servico.listarTutores()).filter((t) => t.tipo === 'sem_responsavel')).toHaveLength(1)
    expect((await servico.buscarPorId(atual.id))?.observacoes).toBe('Resgatado e trazido pela Ana')
  })

  it('animal resgatado pode ser adotado por uma pessoa já cadastrada', async () => {
    await cadastrarPessoa(1, 'João Pereira')
    const atual = await servico.criarSemResponsavel('Resgatado')
    const tutor = await resolverResponsavel(formulario({ tipoResponsavel: 'pessoa', tutor: 'João Pereira' }), atual)
    expect(tutor.id).toBe(1)
  })
})
