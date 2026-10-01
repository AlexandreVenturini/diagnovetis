import { Pet } from '../models/Pet'
import type { Tutor } from '../models/Tutor'
import { supabase } from './storage/supabaseClient'
import { TutorService } from './TutorService'
import { validarObrigatorio, validarIdUnico } from './validation/validadores'

const tutorService = new TutorService()

export const PET_NAO_REMOVIVEL =
  'Este animal não pode ser removido: só veterinários removem, e apenas animais sem histórico na clínica (atendimento, agendamento, receita ou óbito).'

interface PetRow {
  id: number
  nome: string
  especie: string
  raca: string
  tutor_id: number
  idade: string
  peso: string
  sexo: string
  historico: string
  criado_em?: string | null
  obito_em?: string | null
}

export type AtualizacaoPet = Pick<PetRow, 'nome' | 'raca' | 'idade' | 'peso' | 'sexo' | 'historico'> &
  Partial<Pick<PetRow, 'tutor_id'>>

function montarPets(linhas: PetRow[], tutores: Tutor[]): Pet[] {
  const tutoresPorId = new Map(tutores.map((t) => [t.id, t]))
  const pets: Pet[] = []
  for (const r of linhas) {
    const tutor = tutoresPorId.get(r.tutor_id)
    if (!tutor) continue
    const pet = new Pet(
      r.id,
      r.nome,
      r.especie,
      r.raca,
      tutor,
      [],
      r.idade ?? '',
      r.peso ?? '',
      r.sexo ?? '',
      r.historico ?? '',
    )
    pet.criadoEm = r.criado_em ?? null
    pet.obitoEm = r.obito_em ?? null
    tutor.adicionarPet(pet)
    pets.push(pet)
  }
  return pets
}

export class PetService {
  async listarPets(): Promise<Pet[]> {
    const [{ data: dados, error: erro }, tutores] = await Promise.all([
      supabase.from('pets').select('*'),
      tutorService.listarTutores(),
    ])
    if (erro) throw new Error(erro.message)
    return montarPets((dados ?? []) as PetRow[], tutores)
  }

  async listarPorIds(ids: number[]): Promise<Pet[]> {
    if (ids.length === 0) return []
    const { data: dados, error: erro } = await supabase.from('pets').select('*').in('id', ids)
    if (erro) throw new Error(erro.message)
    const linhas = (dados ?? []) as PetRow[]
    const tutores = await tutorService.listarPorIds([...new Set(linhas.map((r) => r.tutor_id))])
    return montarPets(linhas, tutores)
  }

  async adicionarPet(pet: Pet): Promise<void> {
    const todos = await this.listarPets()
    validarIdUnico(pet.id, todos, 'pet')
    validarObrigatorio(pet.nome, 'nome')
    validarObrigatorio(pet.especie, 'especie')
    validarObrigatorio(pet.raca, 'raca')
    const { error: erro } = await supabase.from('pets').insert({
      id: pet.id,
      nome: pet.nome,
      especie: pet.especie,
      raca: pet.raca,
      tutor_id: pet.tutor.id,
      idade: pet.idade,
      peso: pet.peso,
      sexo: pet.sexo,
      historico: pet.historico,
    })
    if (erro) throw new Error(erro.message)
    pet.tutor.adicionarPet(pet)
  }

  async buscarPorId(id: number): Promise<Pet | undefined> {
    const { data: dados, error: erro } = await supabase.from('pets').select('*').eq('id', id).single()
    if (erro || !dados) return undefined
    const tutor = await tutorService.buscarPorId(dados.tutor_id)
    if (!tutor) return undefined
    return new Pet(
      dados.id,
      dados.nome,
      dados.especie,
      dados.raca,
      tutor,
      [],
      dados.idade ?? '',
      dados.peso ?? '',
      dados.sexo ?? '',
      dados.historico ?? '',
    )
  }

  async buscarPorNome(nome: string): Promise<Pet[]> {
    const todos = await this.listarPets()
    return todos.filter((p) => p.nome.toLowerCase().includes(nome.toLowerCase()))
  }

  async atualizarPet(id: number, dados: AtualizacaoPet): Promise<void> {
    validarObrigatorio(dados.nome, 'nome')
    validarObrigatorio(dados.raca, 'raca')
    const { error: erro } = await supabase.from('pets').update(dados).eq('id', id)
    if (erro) throw new Error(erro.message)
  }

  async removerPet(id: number): Promise<void> {
    const { error: erro, count: removidos } = await supabase.from('pets').delete({ count: 'exact' }).eq('id', id)
    if (erro) throw new Error(erro.message)
    if (!removidos) throw new Error(PET_NAO_REMOVIVEL)
  }
}
