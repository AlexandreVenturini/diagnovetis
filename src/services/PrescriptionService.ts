import { supabase } from './storage/supabaseClient'
import type { PrescricaoSalva } from '../models/Prescricao'
import { validatePrescription } from '../features/consultations/prescriptionReport'

export type IssuedPrescription = { id: string; petId: number; snapshot: PrescricaoSalva }

export class PrescriptionService {
  async list(petId?: number): Promise<IssuedPrescription[]> {
    let current = supabase.from('prescricoes').select('*')
    let legacy = supabase.from('consultas').select('id, pet_id, prescricao').not('prescricao', 'is', null)
    if (petId !== undefined) { current = current.eq('pet_id', petId); legacy = legacy.eq('pet_id', petId) }
    const [recent, old] = await Promise.all([current, legacy])
    if (recent.error) throw new Error('Não foi possível carregar o receituário. Confira a conexão e a atualização do banco de dados.')
    if (old.error) throw new Error(old.error.message)
    return [
      ...(recent.data ?? []).map(row => ({ id: row.id as string, petId: row.pet_id as number, snapshot: row.snapshot as PrescricaoSalva })),
      ...(old.data ?? []).map(row => ({ id: `consulta-${row.id}`, petId: row.pet_id as number, snapshot: row.prescricao as PrescricaoSalva })),
    ].sort((a, b) => b.snapshot.issuedAt.localeCompare(a.snapshot.issuedAt))
  }

  async issue(id: string, petId: number, veterinarianId: number, snapshot: PrescricaoSalva): Promise<IssuedPrescription> {
    const error = validatePrescription(snapshot.patient, snapshot.prescription)
    if (error) throw new Error(error)
    const weight = Number(snapshot.patient.weight?.replace(',', '.'))
    if (!Number.isFinite(weight) || weight <= 0) throw new Error('Informe um peso válido em kg.')
    // O mesmo identificador é reutilizado em tentativas após falha de conexão.
    const result = await supabase.from('prescricoes').upsert({ id, pet_id: petId, veterinario_id: veterinarianId, snapshot }, { onConflict: 'id', ignoreDuplicates: true })
    if (result.error) throw new Error('Não foi possível emitir a receita. Confira a conexão e a atualização do banco. Seus dados foram mantidos.')
    const saved = await supabase.from('prescricoes').select('*').eq('id', id).single()
    if (saved.error || !saved.data) throw new Error('Não foi possível confirmar a emissão. Tente novamente para recuperar a mesma receita.')
    return { id: saved.data.id, petId: saved.data.pet_id, snapshot: saved.data.snapshot as PrescricaoSalva }
  }
}
