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

function rowToTutor(row: TutorRow): Tutor {
  const e = row.enderecos
  return new Tutor(
    row.id,
    row.nome,
    row.telefone,
    row.email,
    new Date(row.data_cadastro),
    new Endereco(e.rua, e.numero, e.bairro, e.cidade, e.uf, e.cep),
    [],
    row.cpf ?? '',
  )
}

export class TutorService {
  async listarTutores(): Promise<Tutor[]> {
    const { data, error } = await supabase.from('tutores').select(TUTOR_COM_ENDERECO)
    if (error) throw new Error(error.message)
    return ((data ?? []) as TutorRow[]).map(rowToTutor)
  }

  async listarPorIds(ids: number[]): Promise<Tutor[]> {
    if (ids.length === 0) return []
    const { data, error } = await supabase.from('tutores').select(TUTOR_COM_ENDERECO).in('id', ids)
    if (error) throw new Error(error.message)
    return ((data ?? []) as TutorRow[]).map(rowToTutor)
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

    const { data: endData, error: endError } = await supabase
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
    if (endError) throw new Error(endError.message)

    const { error } = await supabase.from('tutores').insert({
      id: tutor.id,
      nome: tutor.nome,
      telefone: tutor.telefone,
      email: tutor.email,
      cpf: tutor.cpf ?? '',
      data_cadastro: tutor.dataCadastro.toISOString(),
      endereco_id: endData.id,
    })
    if (error) throw new Error(error.message)
  }

  async buscarPorId(id: number): Promise<Tutor | undefined> {
    const { data, error } = await supabase.from('tutores').select(TUTOR_COM_ENDERECO).eq('id', id).single()
    if (error || !data) return undefined
    return rowToTutor(data as TutorRow)
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
