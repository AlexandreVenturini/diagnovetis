import { Tutor, NOME_SEM_RESPONSAVEL, nomeDoSetorIfes, type TipoResponsavel } from '../models/Tutor'
import { Endereco } from '../models/Endereco'
import { supabase } from './storage/supabaseClient'
import {
  validarObrigatorio,
  validarEmail,
  validarTelefone,
  validarCep,
  validarData,
  validarIdUnico,
} from './validation/validadores'

interface EnderecoRow {
  id: number
  rua: string
  numero: number
  bairro: string
  cidade: string
  uf: string
  cep: string
}

interface TutorRow {
  id: number
  nome: string
  telefone: string
  email: string
  cpf: string
  tipo?: TipoResponsavel | null
  cnpj?: string | null
  contato?: string | null
  setor?: string | null
  observacoes?: string | null
  data_cadastro: string
  endereco_id: number | null
  enderecos: EnderecoRow | null
}

const TUTOR_COM_ENDERECO = '*, enderecos(*)'

const normalizar = (texto: string) => texto.trim().toLocaleLowerCase('pt-BR')

function linhaParaTutor(linha: TutorRow): Tutor {
  const e = linha.enderecos
  const tutor = new Tutor(
    linha.id,
    linha.nome,
    linha.telefone,
    linha.email,
    new Date(linha.data_cadastro),
    e ? new Endereco(e.rua, e.numero, e.bairro, e.cidade, e.uf, e.cep) : null,
    [],
    linha.cpf ?? '',
  )
  tutor.tipo = linha.tipo ?? 'pessoa'
  tutor.cnpj = linha.cnpj ?? ''
  tutor.contato = linha.contato ?? ''
  tutor.setor = linha.setor ?? ''
  tutor.observacoes = linha.observacoes ?? ''
  return tutor
}

function validarResponsavel(tutor: Tutor): void {
  validarObrigatorio(tutor.nome, 'nome')
  validarData(tutor.dataCadastro, 'dataCadastro')
  if (tutor.tipo === 'ifes') validarObrigatorio(tutor.setor, 'setor')
  if (tutor.tipo !== 'pessoa' && tutor.tipo !== 'instituicao') return
  validarEmail(tutor.email, 'email')
  validarTelefone(tutor.telefone, 'telefone')
  const endereco = tutor.endereco
  validarObrigatorio(endereco?.rua ?? '', 'rua')
  validarObrigatorio(endereco?.cidade ?? '', 'cidade')
  validarObrigatorio(endereco?.uf ?? '', 'uf')
  validarCep(endereco?.cep ?? '', 'cep')
}

export class TutorService {
  async listarTutores(): Promise<Tutor[]> {
    const { data: dados, error: erro } = await supabase.from('tutores').select(TUTOR_COM_ENDERECO)
    if (erro) throw new Error(erro.message)
    return ((dados ?? []) as TutorRow[]).map(linhaParaTutor)
  }

  async listarPorIds(ids: number[]): Promise<Tutor[]> {
    if (ids.length === 0) return []
    const { data: dados, error: erro } = await supabase.from('tutores').select(TUTOR_COM_ENDERECO).in('id', ids)
    if (erro) throw new Error(erro.message)
    return ((dados ?? []) as TutorRow[]).map(linhaParaTutor)
  }

  async adicionarTutor(tutor: Tutor): Promise<void> {
    const todos = await this.listarTutores()
    validarIdUnico(tutor.id, todos, 'tutor')
    validarResponsavel(tutor)

    let enderecoId: number | null = null
    if (tutor.endereco) {
      const { data: dadosEndereco, error: erroEndereco } = await supabase
        .from('enderecos')
        .insert({
          rua: tutor.endereco.rua,
          numero: tutor.endereco.numero,
          bairro: tutor.endereco.bairro,
          cidade: tutor.endereco.cidade,
          uf: tutor.endereco.uf,
          cep: tutor.endereco.cep,
        })
        .select()
        .single()
      if (erroEndereco) throw new Error(erroEndereco.message)
      enderecoId = dadosEndereco.id
    }

    const { error: erro } = await supabase.from('tutores').insert({
      id: tutor.id,
      nome: tutor.nome,
      telefone: tutor.telefone,
      email: tutor.email,
      cpf: tutor.cpf ?? '',
      tipo: tutor.tipo,
      cnpj: tutor.cnpj,
      contato: tutor.contato,
      setor: tutor.setor,
      observacoes: tutor.observacoes,
      data_cadastro: tutor.dataCadastro.toISOString(),
      endereco_id: enderecoId,
    })
    if (erro) throw new Error(erro.message)
  }

  async buscarPorId(id: number): Promise<Tutor | undefined> {
    const { data: dados, error: erro } = await supabase.from('tutores').select(TUTOR_COM_ENDERECO).eq('id', id).single()
    if (erro || !dados) return undefined
    return linhaParaTutor(dados as TutorRow)
  }

  async buscarPorNome(nome: string): Promise<Tutor[]> {
    const todos = await this.listarTutores()
    return todos.filter((t) => t.nome.toLowerCase().includes(nome.toLowerCase()))
  }

  async buscarResponsavel(tipo: TipoResponsavel, nome: string): Promise<Tutor | undefined> {
    const todos = await this.listarTutores()
    return todos.find((t) => t.tipo === tipo && normalizar(t.nome) === normalizar(nome))
  }

  async obterSetorIfes(setor: string): Promise<Tutor> {
    validarObrigatorio(setor, 'setor')
    const todos = await this.listarTutores()
    const existente = todos.find((t) => t.tipo === 'ifes' && normalizar(t.setor) === normalizar(setor))
    if (existente) return existente
    const novo = new Tutor(proximoId(todos), nomeDoSetorIfes(setor), '', '', new Date(), null)
    novo.tipo = 'ifes'
    novo.setor = setor.trim()
    await this.adicionarTutor(novo)
    return novo
  }

  async criarSemResponsavel(observacoes: string): Promise<Tutor> {
    const todos = await this.listarTutores()
    const novo = new Tutor(proximoId(todos), NOME_SEM_RESPONSAVEL, '', '', new Date(), null)
    novo.tipo = 'sem_responsavel'
    novo.observacoes = observacoes.trim()
    await this.adicionarTutor(novo)
    return novo
  }

  async atualizarTutor(tutor: Tutor): Promise<void> {
    const { error: erro } = await supabase
      .from('tutores')
      .update({
        nome: tutor.nome,
        telefone: tutor.telefone,
        email: tutor.email,
        cpf: tutor.cpf,
        cnpj: tutor.cnpj,
        contato: tutor.contato,
        setor: tutor.setor,
        observacoes: tutor.observacoes,
        data_cadastro: tutor.dataCadastro.toISOString(),
      })
      .eq('id', tutor.id)
    if (erro) throw new Error(erro.message)
  }
}

function proximoId(itens: { id: number }[]): number {
  return Math.max(0, ...itens.map((item) => item.id)) + 1
}
