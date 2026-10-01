import { describe, expect, it } from 'vitest'
import {
  dataParaCampo,
  filtrarHistoricoReceitas,
  limitesPeriodo,
  deslocarPeriodo,
  type FiltrosHistorico,
} from '../features/receitas/historico/filtrosHistorico'
import { ATENDIMENTO_VAZIO } from '../features/atendimentos/atendimentoTipos'
import { receitaVazia, itemReceitaVazio } from '../features/receitas/receita'
import type { ReceitaEmitida } from '../services/ReceitaService'

const filtros: FiltrosHistorico = { visao: 'semana', data: '2026-09-21', busca: '', veterinario: '', medicamento: '' }
const linha = (data: string, nome: string, veterinario: string, medicamento: string): ReceitaEmitida => ({
  id: nome,
  petId: 1,
  snapshot: {
    versao: 1,
    emitidaEm: new Date(`${data}T12:00:00`).toISOString(),
    paciente: { ...ATENDIMENTO_VAZIO, nomePet: nome, nomeTutor: 'Maria', veterinario },
    receita: { ...receitaVazia(), itens: [{ ...itemReceitaVazio(), medicamento }] },
  },
})

describe('Filtros do histórico de receitas', () => {
  it('considera a semana de segunda a domingo, inclusive nas mudanças de ano', () => {
    expect(limitesPeriodo('2026-09-27', 'semana')).toEqual({ inicio: '2026-09-21', fim: '2026-09-27' })
    expect(limitesPeriodo('2027-01-01', 'semana')).toEqual({ inicio: '2026-12-28', fim: '2027-01-03' })
  })
  it('navega entre dias, semanas e meses sem pular fevereiro', () => {
    expect(deslocarPeriodo('2026-01-31', 'mes', 1)).toBe('2026-02-01')
    expect(limitesPeriodo('2028-02-10', 'mes').fim).toBe('2028-02-29')
    expect(deslocarPeriodo('2026-09-21', 'semana', -1)).toBe('2026-09-14')
    expect(deslocarPeriodo('2026-12-31', 'dia', 1)).toBe('2027-01-01')
  })
  it('combina busca, veterinário, medicamento e período', () => {
    const historico = [
      linha('2026-09-21', 'Rex', 'Ana', 'A'),
      linha('2026-09-27', 'Bia', 'João', 'B'),
      linha('2026-09-28', 'Tobi', 'Ana', 'A'),
    ]
    expect(filtrarHistoricoReceitas(historico, filtros).map((item) => item.id)).toEqual(['Rex', 'Bia'])
    expect(
      filtrarHistoricoReceitas(historico, { ...filtros, busca: ' MARIA ', veterinario: 'Ana', medicamento: 'A' }).map(
        (item) => item.id,
      ),
    ).toEqual(['Rex', 'Tobi'])
    expect(
      filtrarHistoricoReceitas(historico, { ...filtros, veterinario: 'Ana', medicamento: 'A' }).map((item) => item.id),
    ).toEqual(['Rex'])
    expect(filtrarHistoricoReceitas(historico, { ...filtros, visao: 'tudo' }).length).toBe(3)
    expect(filtrarHistoricoReceitas(historico, { ...filtros, veterinario: 'Ana', medicamento: 'B' })).toEqual([])
    expect(filtrarHistoricoReceitas(historico, { ...filtros, visao: 'dia' }).length).toBe(1)
    expect(filtrarHistoricoReceitas(historico, { ...filtros, visao: 'mes' }).length).toBe(3)
  })
  it('filtra pela data local da emissão', () => {
    const receita = linha('2026-09-21', 'Rex', 'Ana', 'A')
    receita.snapshot.emitidaEm = '2026-09-22T01:00:00Z'
    expect(
      filtrarHistoricoReceitas([receita], {
        ...filtros,
        visao: 'dia',
        data: dataParaCampo(new Date(receita.snapshot.emitidaEm)),
      }),
    ).toHaveLength(1)
  })
})
