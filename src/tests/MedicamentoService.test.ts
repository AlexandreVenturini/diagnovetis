import { describe, it, expect, beforeEach } from 'vitest'
import './setup'
import { Medicamento } from '../models/Medicamento'
import { MedicamentoService } from '../services/MedicamentoService'
import { ValidacaoError } from '../services/validation/ValidacaoError'

function novoMedicamento(id = 1): Medicamento {
    return new Medicamento(id, 'Amoxicilina Vet', 'Amoxicilina', 'Antibiótico de amplo espectro', 50, 'mg/ml', 'Suspensão oral', 'Oral', 'Uso veterinário')
}

let service: MedicamentoService

beforeEach(() => {
    service = new MedicamentoService()
})

describe('MedicamentoService.adicionarMedicamento', () => {
    it('adiciona medicamento válido com sucesso', async () => {
        await service.adicionarMedicamento(novoMedicamento())
        expect(await service.listarMedicamentos()).toHaveLength(1)
    })

    it('lança erro para id duplicado', async () => {
        await service.adicionarMedicamento(novoMedicamento(1))
        await expect(service.adicionarMedicamento(novoMedicamento(1))).rejects.toThrow(ValidacaoError)
    })

    it('lança erro para nome comercial vazio', async () => {
        const m = new Medicamento(1, '', 'Amoxicilina', 'Desc', 50, 'mg/ml', 'Suspensão', 'Oral', 'Vet')
        await expect(service.adicionarMedicamento(m)).rejects.toThrow(ValidacaoError)
    })

    it('lança erro para princípio ativo vazio', async () => {
        const m = new Medicamento(1, 'Amoxicilina Vet', '', 'Desc', 50, 'mg/ml', 'Suspensão', 'Oral', 'Vet')
        await expect(service.adicionarMedicamento(m)).rejects.toThrow(ValidacaoError)
    })

    it('lança erro para forma farmacêutica vazia', async () => {
        const m = new Medicamento(1, 'Amoxicilina Vet', 'Amoxicilina', 'Desc', 50, 'mg/ml', '', 'Oral', 'Vet')
        await expect(service.adicionarMedicamento(m)).rejects.toThrow(ValidacaoError)
    })

    it('lança erro para via de administração vazia', async () => {
        const m = new Medicamento(1, 'Amoxicilina Vet', 'Amoxicilina', 'Desc', 50, 'mg/ml', 'Suspensão', '', 'Vet')
        await expect(service.adicionarMedicamento(m)).rejects.toThrow(ValidacaoError)
    })

    it('lança erro para concentração zero', async () => {
        const m = new Medicamento(1, 'Amoxicilina Vet', 'Amoxicilina', 'Desc', 0, 'mg/ml', 'Suspensão', 'Oral', 'Vet')
        await expect(service.adicionarMedicamento(m)).rejects.toThrow(ValidacaoError)
    })

    it('lança erro para concentração negativa', async () => {
        const m = new Medicamento(1, 'Amoxicilina Vet', 'Amoxicilina', 'Desc', -10, 'mg/ml', 'Suspensão', 'Oral', 'Vet')
        await expect(service.adicionarMedicamento(m)).rejects.toThrow(ValidacaoError)
    })
})

describe('MedicamentoService.buscarPorNome', () => {
    it('encontra medicamento pelo nome parcial', async () => {
        await service.adicionarMedicamento(novoMedicamento())
        expect(await service.buscarPorNome('amox')).toHaveLength(1)
    })

    it('retorna lista vazia para nome inexistente', async () => {
        await service.adicionarMedicamento(novoMedicamento())
        expect(await service.buscarPorNome('dipirona')).toHaveLength(0)
    })
})

