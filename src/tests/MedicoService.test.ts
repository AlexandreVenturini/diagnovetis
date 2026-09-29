import { describe, it, expect, beforeEach } from 'vitest'
import { inserirMedico } from './setup'
import { Medico } from '../models/Medico'
import { MedicoService } from '../services/MedicoService'

function novoMedico(id = 1): Medico {
    return new Medico(id, 'Dr. Silva', '27933001234', 'silva@vet.com', 'Clínica Geral', '12345-ES')
}

let service: MedicoService

beforeEach(() => {
    service = new MedicoService()
})

describe('MedicoService.buscarPorId', () => {
    it('retorna médico existente', async () => {
        inserirMedico(novoMedico(1))
        expect((await service.buscarPorId(1))?.nome).toBe('Dr. Silva')
    })

    it('retorna undefined para id inexistente', async () => {
        expect(await service.buscarPorId(99)).toBeUndefined()
    })
})

