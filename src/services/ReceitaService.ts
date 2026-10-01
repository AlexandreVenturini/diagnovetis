import { receitaSalvaDeJson, receitaSalvaParaJson } from './storage/conversaoJson'
import { supabase } from './storage/supabaseClient'
import type { PrescricaoSalva } from '../models/Prescricao'
import { fimIntervaloIso, inicioIntervaloIso, type Intervalo } from '../features/shared/periodo'
import { validarReceita } from '../features/receitas/receita'

export type ReceitaEmitida = { id: string; petId: number; snapshot: PrescricaoSalva }

export class ReceitaService {
  async listar(petId?: number, intervalo: Intervalo | null = null): Promise<ReceitaEmitida[]> {
    let busca = supabase.from('prescricoes').select('*')
    if (petId !== undefined) busca = busca.eq('pet_id', petId)
    if (intervalo)
      busca = busca.gte('created_at', inicioIntervaloIso(intervalo)).lte('created_at', fimIntervaloIso(intervalo))
    const { data: dados, error: erro } = await busca
    if (erro)
      throw new Error('Não foi possível carregar o receituário. Confira a conexão e a atualização do banco de dados.')
    return (dados ?? [])
      .map((linha) => ({
        id: linha.id as string,
        petId: linha.pet_id as number,
        snapshot: receitaSalvaDeJson(linha.snapshot),
      }))
      .sort((a, b) => b.snapshot.emitidaEm.localeCompare(a.snapshot.emitidaEm))
  }

  async buscar(id: string): Promise<ReceitaEmitida> {
    const { data: dados, error: erro } = await supabase.from('prescricoes').select('*').eq('id', id).single()
    if (erro || !dados) throw new Error('Não foi possível carregar a receita emitida.')
    return { id: dados.id as string, petId: dados.pet_id as number, snapshot: receitaSalvaDeJson(dados.snapshot) }
  }

  async emitir(id: string, petId: number, veterinarioId: number, snapshot: PrescricaoSalva): Promise<ReceitaEmitida> {
    const erro = validarReceita(snapshot.paciente, snapshot.receita)
    if (erro) throw new Error(erro)
    const peso = Number(snapshot.paciente.peso?.replace(',', '.'))
    if (!Number.isFinite(peso) || peso <= 0) throw new Error('Informe um peso válido em kg.')
    const resultado = await supabase
      .from('prescricoes')
      .upsert(
        { id, pet_id: petId, veterinario_id: veterinarioId, snapshot: receitaSalvaParaJson(snapshot) },
        { onConflict: 'id', ignoreDuplicates: true },
      )
    if (resultado.error)
      throw new Error(
        'Não foi possível emitir a receita. Confira a conexão e a atualização do banco. Seus dados foram mantidos.',
      )
    const salvo = await supabase.from('prescricoes').select('*').eq('id', id).single()
    if (salvo.error || !salvo.data)
      throw new Error('Não foi possível confirmar a emissão. Tente novamente para recuperar a mesma receita.')
    return { id: salvo.data.id, petId: salvo.data.pet_id, snapshot: receitaSalvaDeJson(salvo.data.snapshot) }
  }
}
