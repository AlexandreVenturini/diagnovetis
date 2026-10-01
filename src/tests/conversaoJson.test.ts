import { describe, expect, it } from 'vitest'
import { ATENDIMENTO_VAZIO } from '../features/atendimentos/atendimentoTipos'
import { DADOS_CLINICOS_VAZIOS } from '../features/condicoes/condicaoTipos'
import type { PrescricaoSalva } from '../models/Prescricao'
import {
  dadosClinicosDeJson,
  dadosClinicosParaJson,
  lembretesDeJson,
  lembretesParaJson,
  receitaSalvaDeJson,
  receitaSalvaParaJson,
} from '../services/storage/conversaoJson'

const receitaSalva: PrescricaoSalva = {
  versao: 1,
  emitidaEm: '2026-09-30T12:00:00.000Z',
  paciente: { ...ATENDIMENTO_VAZIO, nomePet: 'Rex', nomeTutor: 'Maria', veterinario: 'Dra. Ana', peso: '12' },
  receita: {
    crmv: 'ES-1',
    orientacoes: 'Dar com comida',
    itens: [
      { medicamento: 'Dipirona', dose: '1 mL', via: 'Oral', frequencia: '8/8h', duracao: '3 dias', quantidade: '1' },
    ],
  },
}

describe('Conversão dos dados gravados em JSON no banco', () => {
  it('grava a receita com as chaves que o banco e as funções SQL já usam', () => {
    const json = receitaSalvaParaJson(receitaSalva) as Record<string, Record<string, unknown>>
    expect(json.issuedAt).toBe('2026-09-30T12:00:00.000Z')
    expect(json.patient).toMatchObject({ dogName: 'Rex', tutorName: 'Maria', veterinarian: 'Dra. Ana', weight: '12' })
    expect(json.prescription).toMatchObject({ crmv: 'ES-1', instructions: 'Dar com comida' })
    expect((json.prescription.items as Record<string, unknown>[])[0]).toEqual({
      medication: 'Dipirona',
      dose: '1 mL',
      route: 'Oral',
      frequency: '8/8h',
      duration: '3 dias',
      quantity: '1',
    })
  })

  it('lê de volta a receita salva sem perder nenhum campo', () => {
    expect(receitaSalvaDeJson(receitaSalvaParaJson(receitaSalva))).toEqual(receitaSalva)
  })

  it('lê receitas antigas gravadas antes da tradução do código', () => {
    const antiga = {
      version: 1,
      issuedAt: '2026-09-01T10:00:00Z',
      patient: { dogName: 'Luna', tutorName: 'João', mainComplaint: 'Tosse', weight: '8' },
      prescription: { crmv: 'ES-2', instructions: '', items: [{ medication: 'X', dose: '2', route: 'Oral' }] },
    }
    const lida = receitaSalvaDeJson(antiga)
    expect(lida.paciente).toMatchObject({ nomePet: 'Luna', nomeTutor: 'João', queixaPrincipal: 'Tosse', peso: '8' })
    expect(lida.receita.itens[0]).toMatchObject({ medicamento: 'X', dose: '2', via: 'Oral' })
  })

  it('converte lembretes da agenda nos dois sentidos', () => {
    const lembretes = [{ id: 1, tipo: 'return' as const, data: '2026-10-01', concluido: false }]
    expect(lembretesParaJson(lembretes)).toEqual([{ id: 1, type: 'return', date: '2026-10-01', done: false }])
    expect(lembretesDeJson(lembretesParaJson(lembretes))).toEqual(lembretes)
    expect(lembretesDeJson(null)).toEqual([])
  })

  it('converte os dados clínicos das condições nos dois sentidos', () => {
    const dados = { ...DADOS_CLINICOS_VAZIOS, categoria: 'Infecciosa', ehZoonose: true, sistemas: ['Renal'] }
    const json = dadosClinicosParaJson(dados)
    expect(json).toMatchObject({ category: 'Infecciosa', isZoonosis: true, systems: ['Renal'] })
    expect(dadosClinicosDeJson(json)).toEqual(dados)
    expect(dadosClinicosDeJson(null)).toBeNull()
  })
})
