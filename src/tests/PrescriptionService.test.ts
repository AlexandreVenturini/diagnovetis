import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EMPTY_CONSULTATION } from '../features/consultations/consultationTypes'
import type { PrescricaoSalva } from '../models/Prescricao'

const mock = vi.hoisted(() => ({ from: vi.fn() }))
vi.mock('../services/storage/supabaseClient', () => ({ supabase: mock }))
import { PrescriptionService } from '../services/PrescriptionService'

const snapshot: PrescricaoSalva = { version: 1, issuedAt: '2026-09-15T12:00:00Z', patient: { ...EMPTY_CONSULTATION, dogName: 'Animal', tutorName: 'Tutor', veterinarian: 'Veterinário', weight: '2,5' }, prescription: { crmv: '123-ES', instructions: '', items: [{ medication: 'Item teste', dose: 'Dose teste', route: 'Via teste', frequency: 'Intervalo teste', duration: 'Duração teste', quantity: 'Quantidade teste' }] } }

beforeEach(() => mock.from.mockReset())
describe('Receituário independente', () => {
  it('valida os dados antes de tentar gravar', async () => {
    await expect(new PrescriptionService().issue('id', 1, 1, { ...snapshot, patient: { ...snapshot.patient, weight: 'Infinity' } })).rejects.toThrow('peso')
    await expect(new PrescriptionService().issue('id', 1, 1, { ...snapshot, prescription: { ...snapshot.prescription, items: [] } })).rejects.toThrow('Preencha')
    expect(mock.from).not.toHaveBeenCalled()
  })
  it('reutiliza o identificador e retorna a cópia efetivamente salva sem sobrescrever uma emissão', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null })
    const single = vi.fn().mockResolvedValue({ data: { id: 'id', pet_id: 1, snapshot }, error: null })
    mock.from.mockReturnValue({ upsert, select: () => ({ eq: () => ({ single }) }) })
    const service = new PrescriptionService()
    expect((await service.issue('id', 1, 2, snapshot)).snapshot).toEqual(snapshot)
    expect((await service.issue('id', 1, 2, { ...snapshot, issuedAt: '2026-09-16T12:00:00Z' })).snapshot).toEqual(snapshot)
    expect(upsert).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'id', pet_id: 1, veterinario_id: 2 }), { onConflict: 'id', ignoreDuplicates: true })
  })
  it('não informa sucesso quando o banco rejeita a emissão', async () => {
    mock.from.mockReturnValue({ upsert: vi.fn().mockResolvedValue({ error: { message: 'offline' } }) })
    await expect(new PrescriptionService().issue('id', 1, 1, snapshot)).rejects.toThrow('Seus dados foram mantidos')
  })
  it('combina receitas novas e antigas e filtra ambas pelo id do animal', async () => {
    const eq = vi.fn()
    mock.from.mockImplementation((table: string) => {
      const result = { data: table === 'prescricoes' ? [{ id: 'nova', pet_id: 7, snapshot }] : [{ id: 9, pet_id: 7, prescricao: { ...snapshot, issuedAt: '2026-09-14T12:00:00Z' } }], error: null }
      const chain = { not: () => chain, eq: (key: string, value: number) => { eq(table, key, value); return chain }, then: (resolve: (value: typeof result) => void) => resolve(result) }
      return { select: () => chain }
    })
    const rows = await new PrescriptionService().list(7)
    expect(rows.map(row => row.id)).toEqual(['nova', 'consulta-9'])
    expect(eq).toHaveBeenCalledWith('prescricoes', 'pet_id', 7)
    expect(eq).toHaveBeenCalledWith('consultas', 'pet_id', 7)
  })
})
