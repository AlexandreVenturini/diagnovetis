import { Tutor } from '../models/Tutor'
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
  data_cadastro: string
  endereco_id: number
  enderecos: EnderecoRow
}

const TUTOR_COM_ENDERECO = '*, enderecos(*)'

function linhaParaTutor(linha: TutorRow): Tutor {
  const e = linha.enderecos
  return new Tutor(
    linha.id,
    linha.nome,
    linha.telefone,
    linha.email,
    new Date(linha.data_cadastro),
    new Endereco(e.rua, e.numero, e.bairro, e.cidade, e.uf, e.cep),
    [],
    linha.cpf ?? '',
  )
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
    validarObrigatorio(tutor.nome, 'nome')
    validarEmail(tutor.email, 'email')
    validarTelefone(tutor.telefone, 'telefone')
    validarData(tutor.dataCadastro, 'dataCadastro')
    validarObrigatorio(tutor.endereco.rua, 'rua')
    validarObrigatorio(tutor.endereco.cidade, 'cidade')
    validarObrigatorio(tutor.endereco.uf, 'uf')
    validarCep(tutor.endereco.cep, 'cep')

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

    const { error: erro } = await supabase.from('tutores').insert({
      id: tutor.id,
      nome: tutor.nome,
      telefone: tutor.telefone,
      email: tutor.email,
      cpf: tutor.cpf ?? '',
      data_cadastro: tutor.dataCadastro.toISOString(),
      endereco_id: dadosEndereco.id,
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

  async atualizarTutor(tutor: Tutor): Promise<void> {
    await supabase
      .from('tutores')
      .update({
        nome: tutor.nome,
        telefone: tutor.telefone,
        email: tutor.email,
        data_cadastro: tutor.dataCadastro.toISOString(),
      })
      .eq('id', tutor.id)
  }
}
