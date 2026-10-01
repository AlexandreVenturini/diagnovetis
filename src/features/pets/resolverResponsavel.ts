import { Endereco } from '../../models/Endereco'
import { Tutor } from '../../models/Tutor'
import { TutorService } from '../../services/TutorService'
import type { DadosFormularioTutor } from '../tutores/tutorTipos'
import type { DadosFormularioPet } from './petTipos'

const tutorService = new TutorService()

export const MENSAGEM_CADASTRAR_RESPONSAVEL = 'Cadastre o responsável completo antes de registrar o cão.'

export class TutorNaoEncontradoError extends Error {
  constructor(nome: string) {
    super(`Responsável '${nome}' não encontrado. ${MENSAGEM_CADASTRAR_RESPONSAVEL}`)
    this.name = 'TutorNaoEncontradoError'
  }
}

const normalizar = (texto: string) => texto.trim().toLocaleLowerCase('pt-BR')

export function formularioParaTutor(id: number, formulario: DadosFormularioTutor): Tutor {
  const ehPessoa = formulario.tipo === 'pessoa'
  const tutor = new Tutor(
    id,
    formulario.nome.trim(),
    formulario.telefone.trim(),
    formulario.email.trim(),
    new Date(`${formulario.dataCadastro}T12:00:00`),
    new Endereco(
      formulario.rua.trim(),
      Number(formulario.numero),
      formulario.bairro.trim(),
      formulario.cidade.trim(),
      formulario.estado.trim().toUpperCase(),
      formulario.cep.trim(),
    ),
    [],
    ehPessoa ? formulario.cpf.trim() : '',
  )
  tutor.tipo = formulario.tipo
  tutor.cnpj = ehPessoa ? '' : formulario.cnpj.trim()
  tutor.contato = ehPessoa ? '' : formulario.contato.trim()
  return tutor
}

export async function resolverResponsavel(formulario: DadosFormularioPet, atual?: Tutor): Promise<Tutor> {
  const tipo = formulario.tipoResponsavel ?? 'pessoa'
  if (tipo === 'ifes') {
    const setor = formulario.setor ?? ''
    if (atual?.tipo === 'ifes' && normalizar(atual.setor) === normalizar(setor)) return atual
    return tutorService.obterSetorIfes(setor)
  }
  if (tipo === 'sem_responsavel') {
    const observacoes = formulario.observacoesResponsavel ?? ''
    if (atual?.tipo !== 'sem_responsavel') return tutorService.criarSemResponsavel(observacoes)
    atual.observacoes = observacoes.trim()
    await tutorService.atualizarTutor(atual)
    return atual
  }
  if (atual?.tipo === tipo && normalizar(atual.nome) === normalizar(formulario.tutor)) return atual
  const tutor = await tutorService.buscarResponsavel(tipo, formulario.tutor)
  if (!tutor) throw new TutorNaoEncontradoError(formulario.tutor.trim())
  return tutor
}
