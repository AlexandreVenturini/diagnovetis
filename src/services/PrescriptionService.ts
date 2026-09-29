import { supabase } from './storage/supabaseClient'
import type { PrescricaoSalva } from '../models/Prescricao'
import { rangeEndIso, rangeStartIso, type DateRange } from '../features/common/period'
import { validatePrescription } from '../features/consultations/prescriptionReport'

export type IssuedPrescription = { id: string; petId: number; snapshot: PrescricaoSalva }

export class PrescriptionService {
  async list(petId?: number, range: DateRange | null = null): Promise<IssuedPrescription[]> {
    let query = supabase.from('prescricoes').select('*')
    if (petId !== undefined) query = query.eq('pet_id', petId)
    if (range) query = query.gte('created_at', rangeStartIso(range)).lte('created_at', rangeEndIso(range))
    const { data, error } = await query
    if (error)
      throw new Error('Não foi possível carregar o receituário. Confira a conexão e a atualização do banco de dados.')
    return (data ?? [])
      .map((row) => ({ id: row.id as string, petId: row.pet_id as number, snapshot: row.snapshot as PrescricaoSalva }))
      .sort((a, b) => b.snapshot.issuedAt.localeCompare(a.snapshot.issuedAt))
  }

  async get(id: string): Promise<IssuedPrescription> {
    const { data, error } = await supabase.from('prescricoes').select('*').eq('id', id).single()
    if (error || !data) throw new Error('Não foi possível carregar a receita emitida.')
    return { id: data.id as string, petId: data.pet_id as number, snapshot: data.snapshot as PrescricaoSalva }
  }

  async issue(
    id: string,
    petId: number,
    veterinarianId: number,
    snapshot: PrescricaoSalva,
  ): Promise<IssuedPrescription> {
    const error = validatePrescription(snapshot.patient, snapshot.prescription)
    if (error) throw new Error(error)
    const weight = Number(snapshot.patient.weight?.replace(',', '.'))
    if (!Number.isFinite(weight) || weight <= 0) throw new Error('Informe um peso válido em kg.')
    const result = await supabase
      .from('prescricoes')
      .upsert(
        { id, pet_id: petId, veterinario_id: veterinarianId, snapshot },
        { onConflict: 'id', ignoreDuplicates: true },
      )
    if (result.error)
      throw new Error(
        'Não foi possível emitir a receita. Confira a conexão e a atualização do banco. Seus dados foram mantidos.',
      )
    const saved = await supabase.from('prescricoes').select('*').eq('id', id).single()
    if (saved.error || !saved.data)
      throw new Error('Não foi possível confirmar a emissão. Tente novamente para recuperar a mesma receita.')
    return { id: saved.data.id, petId: saved.data.pet_id, snapshot: saved.data.snapshot as PrescricaoSalva }
  }
}
