import { describe, it, expect, beforeEach } from 'vitest'
import './setup'
import { Zoonose } from '../models/Zoonose'
import { ZoonoseService } from '../services/ZoonoseService'
import { ValidacaoError } from '../services/validation/ValidacaoError'

function novaZoonose(id = 1, grau = 'alto'): Zoonose {
    return new Zoonose(id, 'Leishmaniose', 'Leishmania infantum', 'Febre, perda de peso', 'Uso de repelente, vacinação', grau)
}

let service: ZoonoseService

beforeEach(() => {
    service = new ZoonoseService()
})

describe('ZoonoseService.adicionarZoonose', () => {
    it('adiciona zoonose válida com sucesso', async () => {
        await service.adicionarZoonose(novaZoonose())
        expect(await service.listarZoonoses()).toHaveLength(1)
    })

    it('lança erro para id duplicado', async () => {
        await service.adicionarZoonose(novaZoonose(1))
        await expect(service.adicionarZoonose(novaZoonose(1))).rejects.toThrow(ValidacaoError)
    })

    it('lança erro para nome vazio', async () => {
        const z = new Zoonose(1, '', 'Leishmania infantum', 'Febre', 'Vacinação', 'alto')
        await expect(service.adicionarZoonose(z)).rejects.toThrow(ValidacaoError)
    })

    it('lança erro para agente etiológico vazio', async () => {
        const z = new Zoonose(1, 'Leishmaniose', '', 'Febre', 'Vacinação', 'alto')
        await expect(service.adicionarZoonose(z)).rejects.toThrow(ValidacaoError)
    })

    it('lança erro para sintomas vazios', async () => {
        const z = new Zoonose(1, 'Leishmaniose', 'Leishmania infantum', '', 'Vacinação', 'alto')
        await expect(service.adicionarZoonose(z)).rejects.toThrow(ValidacaoError)
    })

    it('lança erro para medidas preventivas vazias', async () => {
        const z = new Zoonose(1, 'Leishmaniose', 'Leishmania infantum', 'Febre', '', 'alto')
        await expect(service.adicionarZoonose(z)).rejects.toThrow(ValidacaoError)
    })

    it('lança erro para grau de risco inválido', async () => {
        const z = new Zoonose(1, 'Leishmaniose', 'Leishmania infantum', 'Febre', 'Vacinação', 'crítico')
        await expect(service.adicionarZoonose(z)).rejects.toThrow(ValidacaoError)
    })

    it('aceita grau de risco "baixo"', async () => {
        await expect(service.adicionarZoonose(novaZoonose(1, 'baixo'))).resolves.not.toThrow()
    })

    it('aceita grau de risco "medio"', async () => {
        await expect(service.adicionarZoonose(novaZoonose(1, 'medio'))).resolves.not.toThrow()
    })
})

describe('ZoonoseService.listarAltoRisco', () => {
    it('retorna apenas zoonoses de alto risco', async () => {
        await service.adicionarZoonose(novaZoonose(1, 'alto'))
        await service.adicionarZoonose(novaZoonose(2, 'medio'))
        await service.adicionarZoonose(novaZoonose(3, 'baixo'))
        const altoRisco = await service.listarAltoRisco()
        expect(altoRisco).toHaveLength(1)
        expect(altoRisco[0].grauRisco).toBe('alto')
    })

    it('retorna lista vazia quando não há zoonoses de alto risco', async () => {
        await service.adicionarZoonose(novaZoonose(1, 'baixo'))
        expect(await service.listarAltoRisco()).toHaveLength(0)
    })
})

describe('ZoonoseService.buscarPorNome', () => {
    it('encontra zoonose pelo nome parcial', async () => {
        await service.adicionarZoonose(novaZoonose())
        expect(await service.buscarPorNome('leish')).toHaveLength(1)
    })

    it('retorna lista vazia para nome inexistente', async () => {
        await service.adicionarZoonose(novaZoonose())
        expect(await service.buscarPorNome('raiva')).toHaveLength(0)
    })
})

describe('ZoonoseService.atualizarZoonose', () => {
    it('atualiza zoonose existente', async () => {
        await service.adicionarZoonose(novaZoonose())
        const atualizada = new Zoonose(1, 'Raiva', 'Lyssavirus', 'Hidrofobia', 'Vacinação', 'alto')
        await service.atualizarZoonose(atualizada)
        expect((await service.buscarPorId(1))?.nome).toBe('Raiva')
    })
})

describe('ZoonoseService.removerZoonose', () => {
    it('remove zoonose existente', async () => {
        await service.adicionarZoonose(novaZoonose())
        await service.removerZoonose(1)
        expect(await service.listarZoonoses()).toHaveLength(0)
    })
})
