import { describe, it, expect, beforeEach } from 'vitest'
import './setup'
import { Medico } from '../models/Medico'
import { MedicoService } from '../services/MedicoService'
import { ValidacaoError } from '../services/validation/ValidacaoError'

function novoMedico(id = 1): Medico {
    return new Medico(id, 'Dr. Silva', '27933001234', 'silva@vet.com', 'Clínica Geral', '12345-ES')
}

let service: MedicoService

beforeEach(() => {
    service = new MedicoService()
})

describe('MedicoService.adicionarMedico', () => {
    it('adiciona médico válido com sucesso', async () => {
        await service.adicionarMedico(novoMedico())
        expect(await service.listarMedicos()).toHaveLength(1)
    })

    it('lança erro para id duplicado', async () => {
        await service.adicionarMedico(novoMedico(1))
        await expect(service.adicionarMedico(novoMedico(1))).rejects.toThrow(ValidacaoError)
    })

    it('lança erro para nome vazio', async () => {
        const medico = new Medico(1, '', '27933001234', 'silva@vet.com', 'Clínica Geral', '12345-ES')
        await expect(service.adicionarMedico(medico)).rejects.toThrow(ValidacaoError)
    })

    it('lança erro para e-mail inválido', async () => {
        const medico = new Medico(1, 'Dr. Silva', '27933001234', 'email-invalido', 'Clínica Geral', '12345-ES')
        await expect(service.adicionarMedico(medico)).rejects.toThrow(ValidacaoError)
    })

    it('lança erro para telefone inválido', async () => {
        const medico = new Medico(1, 'Dr. Silva', '123', 'silva@vet.com', 'Clínica Geral', '12345-ES')
        await expect(service.adicionarMedico(medico)).rejects.toThrow(ValidacaoError)
    })

    it('lança erro para especialidade vazia', async () => {
        const medico = new Medico(1, 'Dr. Silva', '27933001234', 'silva@vet.com', '', '12345-ES')
        await expect(service.adicionarMedico(medico)).rejects.toThrow(ValidacaoError)
    })

    it('lança erro para CRMV inválido', async () => {
        const medico = new Medico(1, 'Dr. Silva', '27933001234', 'silva@vet.com', 'Clínica Geral', 'CRMV-INVALIDO')
        await expect(service.adicionarMedico(medico)).rejects.toThrow(ValidacaoError)
    })
})

describe('MedicoService.buscarPorId', () => {
    it('retorna médico existente', async () => {
        await service.adicionarMedico(novoMedico(1))
        expect((await service.buscarPorId(1))?.nome).toBe('Dr. Silva')
    })

    it('retorna undefined para id inexistente', async () => {
        expect(await service.buscarPorId(99)).toBeUndefined()
    })
})

describe('MedicoService.listarPorEspecialidade', () => {
    it('filtra médicos pela especialidade', async () => {
        await service.adicionarMedico(novoMedico(1))
        await service.adicionarMedico(new Medico(2, 'Dra. Lima', '27933005678', 'lima@vet.com', 'Cirurgia', '67890-ES'))
        expect(await service.listarPorEspecialidade('clínica')).toHaveLength(1)
    })
})

describe('MedicoService.buscarPorCrmv', () => {
    it('encontra médico pelo CRMV exato', async () => {
        await service.adicionarMedico(novoMedico())
        expect((await service.buscarPorCrmv('12345-ES'))?.nome).toBe('Dr. Silva')
    })

    it('retorna undefined para CRMV inexistente', async () => {
        expect(await service.buscarPorCrmv('99999-ES')).toBeUndefined()
    })
})

describe('MedicoService.removerMedico', () => {
    it('remove médico existente', async () => {
        await service.adicionarMedico(novoMedico())
        await service.removerMedico(1)
        expect(await service.listarMedicos()).toHaveLength(0)
    })
})
