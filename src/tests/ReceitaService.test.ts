import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ATENDIMENTO_VAZIO } from '../features/atendimentos/atendimentoTipos'
import type { PrescricaoSalva } from '../models/Prescricao'

const mock = vi.hoisted(() => ({ from: vi.fn() }))
vi.mock('../services/storage/supabaseClient', () => ({ supabase: mock }))
import { ReceitaService } from '../services/ReceitaService'

const snapshot: PrescricaoSalva = {
  versao: 1,
  emitidaEm: '2026-09-15T12:00:00Z',
  paciente: { ...ATENDIMENTO_VAZIO, nomePet: 'Animal', nomeTutor: 'Tutor', veterinario: 'Veterinário', peso: '2,5' },
  receita: {
    crmv: '123-ES',
    orientacoes: '',
    itens: [
      {
        medicamento: 'Item teste',
        dose: 'Dose teste',
        via: 'Via teste',
        frequencia: 'Intervalo teste',
        duracao: 'Duração teste',
        quantidade: 'Quantidade teste',
      },
    ],
  },
}

beforeEach(() => mock.from.mockReset())
describe('Receituário independente', () => {
  it('valida os dados antes de tentar gravar', async () => {
    await expect(
      new ReceitaService().emitir('id', 1, 1, {
        ...snapshot,
        paciente: { ...snapshot.paciente, peso: 'Infinity' },
      }),
    ).rejects.toThrow('peso')
    await expect(
      new ReceitaService().emitir('id', 1, 1, {
        ...snapshot,
        receita: { ...snapshot.receita, itens: [] },
      }),
    ).rejects.toThrow('Preencha')
    expect(mock.from).not.toHaveBeenCalled()
  })
  it('reutiliza o identificador e retorna a cópia efetivamente salva sem sobrescrever uma emissão', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null })
    const single = vi.fn().mockResolvedValue({ data: { id: 'id', pet_id: 1, snapshot }, error: null })
    mock.from.mockReturnValue({ upsert, select: () => ({ eq: () => ({ single }) }) })
    const servico = new ReceitaService()
    expect((await servico.emitir('id', 1, 2, snapshot)).snapshot).toEqual(snapshot)
    expect((await servico.emitir('id', 1, 2, { ...snapshot, emitidaEm: '2026-09-16T12:00:00Z' })).snapshot).toEqual(
      snapshot,
    )
    expect(upsert).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'id', pet_id: 1, veterinario_id: 2 }), {
      onConflict: 'id',
      ignoreDuplicates: true,
    })
  })
  it('não informa sucesso quando o banco rejeita a emissão', async () => {
    mock.from.mockReturnValue({ upsert: vi.fn().mockResolvedValue({ error: { message: 'offline' } }) })
    await expect(new ReceitaService().emitir('id', 1, 1, snapshot)).rejects.toThrow('Seus dados foram mantidos')
  })
  it('lista as receitas do animal pela tabela de receitas emitidas', async () => {
    const eq = vi.fn()
    mock.from.mockImplementation((table: string) => {
      const resultado = { data: [{ id: 'nova', pet_id: 7, snapshot }], error: null }
      const chain = {
        eq: (key: string, valor: number) => {
          eq(table, key, valor)
          return chain
        },
        then: (resolve: (valor: typeof resultado) => void) => resolve(resultado),
      }
      return { select: () => chain }
    })
    const linhas = await new ReceitaService().listar(7)
    expect(linhas.map((linha) => linha.id)).toEqual(['nova'])
    expect(eq).toHaveBeenCalledWith('prescricoes', 'pet_id', 7)
    expect(eq).toHaveBeenCalledTimes(1)
  })
})
