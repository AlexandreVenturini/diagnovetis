import { describe, expect, it } from 'vitest'
import { EMPTY_CLINICAL } from '../features/zoonoses/zoonosisTypes'
import { EMPTY_FILTERS, filterConditions } from '../features/zoonoses/clinicalCatalog'
import { zoonoseToFrontend } from '../hooks/useZoonoses'
import { Zoonose } from '../models/Zoonose'
import { ZoonoseService } from '../services/ZoonoseService'

const item = (id: number, name: string, isZoonosis: boolean) => {
  const condition = new Zoonose(id, name, 'Agente teste', 'Sinal clínico teste', 'Prevenção teste', 'alto')
  condition.clinical = { ...structuredClone(EMPTY_CLINICAL), isZoonosis, category: 'Infecciosas', systems: ['Renal'], etiology: 'Bacteriana', ageGroups: ['Adulto'], transmission: 'Transmissão cadastrada', diagnostics: ['Exame cadastrado'], differentials: ['Diferencial cadastrado'], protocols: ['Conduta cadastrada'] }
  return condition
}

describe('Catálogo de condições clínicas', () => {
  it('preserva campos clínicos após salvar e recarregar', async () => {
    const service = new ZoonoseService()
    const condition = item(1, 'Condição teste', false)
    await service.adicionarZoonose(condition)
    const [saved] = await service.listarZoonoses()
    expect(saved.clinical).toEqual(condition.clinical)
    expect(zoonoseToFrontend(saved).transmission).toBe('Transmissão cadastrada')
    expect(zoonoseToFrontend(saved).diagnostics).toEqual(['Exame cadastrado'])
  })
  it('carrega registros antigos sem inventar sistemas ou protocolos', () => {
    const legacy = zoonoseToFrontend(new Zoonose(1, 'Antiga', 'Agente', 'Sinal', 'Prevenção', 'alto'))
    expect(legacy.clinical.isZoonosis).toBe(true)
    expect(legacy.clinical.systems).toEqual([])
    expect(legacy.clinical.protocols).toEqual([])
  })
  it('combina filtros e encontra sinais clínicos sem exigir acentos', () => {
    const rows = [zoonoseToFrontend(item(1, 'Beta', true)), zoonoseToFrontend(item(2, 'Alfa', false))]
    expect(filterConditions(rows, { ...EMPTY_FILTERS, query: 'clinico', category: 'Infecciosas', system: 'Renal', etiology: 'Bacteriana', age: 'Adulto', zoonosis: 'no' }).map(row => row.name)).toEqual(['Alfa'])
    expect(filterConditions(rows, { ...EMPTY_FILTERS, system: 'Respiratório' })).toHaveLength(0)
    expect(filterConditions(rows, { ...EMPTY_FILTERS, query: 'agente' })).toHaveLength(2)
  })
  it('ordena sem alterar os registros originais', () => {
    const rows = [zoonoseToFrontend(item(1, 'Beta', true)), zoonoseToFrontend(item(2, 'Alfa', false))]
    expect(filterConditions(rows, EMPTY_FILTERS).map(row => row.name)).toEqual(['Alfa', 'Beta'])
    expect(filterConditions(rows, { ...EMPTY_FILTERS, sort: 'za' }).map(row => row.name)).toEqual(['Beta', 'Alfa'])
    expect(rows[0].name).toBe('Beta')
  })
})
