import { describe, it, expect, beforeEach } from 'vitest'
import './setup'
import { Zoonose } from '../models/Zoonose'
import { ZoonoseService } from '../services/ZoonoseService'
import { ValidacaoError } from '../services/validation/ValidacaoError'

function novaZoonose(id = 1, grau = 'alto'): Zoonose {
  return new Zoonose(
    id,
    'Leishmaniose',
    'Leishmania infantum',
    'Febre, perda de peso',
    'Uso de repelente, vacinação',
    grau,
  )
}

let servico: ZoonoseService

beforeEach(() => {
  servico = new ZoonoseService()
})

describe('ZoonoseService.adicionarZoonose', () => {
  it('adiciona zoonose válida com sucesso', async () => {
    await servico.adicionarZoonose(novaZoonose())
    expect(await servico.listarZoonoses()).toHaveLength(1)
  })

  it('lança erro para id duplicado', async () => {
    await servico.adicionarZoonose(novaZoonose(1))
    await expect(servico.adicionarZoonose(novaZoonose(1))).rejects.toThrow(ValidacaoError)
  })

  it('lança erro para nome vazio', async () => {
    const z = new Zoonose(1, '', 'Leishmania infantum', 'Febre', 'Vacinação', 'alto')
    await expect(servico.adicionarZoonose(z)).rejects.toThrow(ValidacaoError)
  })

  it('lança erro para agente etiológico vazio', async () => {
    const z = new Zoonose(1, 'Leishmaniose', '', 'Febre', 'Vacinação', 'alto')
    await expect(servico.adicionarZoonose(z)).rejects.toThrow(ValidacaoError)
  })

  it('lança erro para sintomas vazios', async () => {
    const z = new Zoonose(1, 'Leishmaniose', 'Leishmania infantum', '', 'Vacinação', 'alto')
    await expect(servico.adicionarZoonose(z)).rejects.toThrow(ValidacaoError)
  })

  it('lança erro para medidas preventivas vazias', async () => {
    const z = new Zoonose(1, 'Leishmaniose', 'Leishmania infantum', 'Febre', '', 'alto')
    await expect(servico.adicionarZoonose(z)).rejects.toThrow(ValidacaoError)
  })

  it('lança erro para grau de risco inválido', async () => {
    const z = new Zoonose(1, 'Leishmaniose', 'Leishmania infantum', 'Febre', 'Vacinação', 'crítico')
    await expect(servico.adicionarZoonose(z)).rejects.toThrow(ValidacaoError)
  })

  it('aceita grau de risco "baixo"', async () => {
    await expect(servico.adicionarZoonose(novaZoonose(1, 'baixo'))).resolves.not.toThrow()
  })

  it('aceita grau de risco "medio"', async () => {
    await expect(servico.adicionarZoonose(novaZoonose(1, 'medio'))).resolves.not.toThrow()
  })
})

describe('ZoonoseService.buscarPorNome', () => {
  it('encontra zoonose pelo nome parcial', async () => {
    await servico.adicionarZoonose(novaZoonose())
    expect(await servico.buscarPorNome('leish')).toHaveLength(1)
  })

  it('retorna lista vazia para nome inexistente', async () => {
    await servico.adicionarZoonose(novaZoonose())
    expect(await servico.buscarPorNome('raiva')).toHaveLength(0)
  })
})
