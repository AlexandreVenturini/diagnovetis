import { describe, it, expect, beforeEach } from 'vitest'
import './setup'
import { Consulta } from '../models/Consulta'
import { DiagnosticoZoonose } from '../models/DiagnosticoZoonose'
import { Endereco } from '../models/Endereco'
import { Exame } from '../models/Exame'
import { Medico } from '../models/Medico'
import { Medicamento } from '../models/Medicamento'
import { MedicamentoReceitado } from '../models/MedicamentoReceitado'
import { Pet } from '../models/Pet'
import { Receita } from '../models/Receita'
import { Tutor } from '../models/Tutor'
import { ConsultaService } from '../services/ConsultaService'
import { ExameService } from '../services/ExameService'
import { MedicoService } from '../services/MedicoService'
import { PetService } from '../services/PetService'
import { ReceitaService } from '../services/ReceitaService'
import { TutorService } from '../services/TutorService'

function criarMedico(id = 1): Medico {
    return new Medico(id, 'Dr. Silva', '27933001234', 'silva@vet.com', 'Clínica Geral', '12345-ES')
}

function criarTutor(id = 1): Tutor {
    return new Tutor(id, 'Ana Costa', '27933001234', 'ana@email.com', new Date('2024-01-01'), new Endereco('Rua A', 1, 'Bairro', 'Vitória', 'ES', '29010100'))
}

function criarPet(tutor: Tutor, id = 1): Pet {
    return new Pet(id, 'Rex', 'Cão', 'Labrador', tutor)
}

function criarExame(id = 1): Exame {
    return new Exame(id, 'Hemograma', new Date(), 'Normal')
}

function criarMedicamento(): Medicamento {
    return new Medicamento(1, 'Amoxicilina Vet', 'Amoxicilina', 'Antibiótico', 50, 'mg/ml', 'Suspensão', 'Oral', 'Vet')
}

function criarMedicamentoReceitado(): MedicamentoReceitado {
    return new MedicamentoReceitado(1, '5ml', 2, 7, criarMedicamento(), 'Após refeição')
}

function criarReceita(id = 1): Receita {
    return new Receita(id, [criarMedicamentoReceitado()])
}

function dataFutura(dias = 1): Date {
    const data = new Date()
    data.setDate(data.getDate() + dias)
    return data
}

function criarConsulta(medico: Medico, pet: Pet, id = 1, exames: Exame[] = [], receitas: Receita[] = []): Consulta {
    return new Consulta(id, dataFutura(), '09:00', 'Diagnóstico', 'Obs', medico, pet, new DiagnosticoZoonose('negativo', 'Sem sinais', new Date()), exames, receitas)
}

let exameService: ExameService
let receitaService: ReceitaService
let consultaService: ConsultaService
let medico: Medico
let tutor: Tutor
let pet: Pet

beforeEach(async () => {
    exameService = new ExameService()
    receitaService = new ReceitaService()
    consultaService = new ConsultaService()
    const medicoService = new MedicoService()
    const tutorService = new TutorService()
    const petService = new PetService()

    medico = criarMedico()
    tutor = criarTutor()
    pet = criarPet(tutor)

    await medicoService.adicionarMedico(medico)
    await tutorService.adicionarTutor(tutor)
    await petService.adicionarPet(pet)
})

describe('ExameService', () => {
    it('listarPorConsulta retorna exames da consulta', async () => {
        const consulta = criarConsulta(medico, pet, 1, [criarExame(1), criarExame(2)])
        await consultaService.adicionarConsulta(consulta)
        expect(await exameService.listarPorConsulta(1)).toHaveLength(2)
    })

    it('listarPorConsulta retorna lista vazia para consulta sem exames', async () => {
        const consulta = criarConsulta(medico, pet, 1, [])
        await consultaService.adicionarConsulta(consulta)
        expect(await exameService.listarPorConsulta(1)).toHaveLength(0)
    })

    it('listarPorConsulta retorna lista vazia para consulta inexistente', async () => {
        expect(await exameService.listarPorConsulta(99)).toHaveLength(0)
    })

    it('listarTodos retorna exames de todas as consultas', async () => {
        await consultaService.adicionarConsulta(criarConsulta(medico, pet, 1, [criarExame(1)]))
        await consultaService.adicionarConsulta(criarConsulta(medico, pet, 2, [criarExame(2), criarExame(3)]))
        expect(await exameService.listarTodos()).toHaveLength(3)
    })

    it('buscarPorId encontra exame pelo id', async () => {
        await consultaService.adicionarConsulta(criarConsulta(medico, pet, 1, [criarExame(42)]))
        expect((await exameService.buscarPorId(42))?.nomeExame).toBe('Hemograma')
    })

    it('buscarPorId retorna undefined para id inexistente', async () => {
        expect(await exameService.buscarPorId(99)).toBeUndefined()
    })

    it('listarPorPet retorna exames do pet correto', async () => {
        const tutor2 = criarTutor(2)
        const pet2 = criarPet(tutor2, 2)
        const tutorService = new TutorService()
        const petService = new PetService()
        await tutorService.adicionarTutor(tutor2)
        await petService.adicionarPet(pet2)

        await consultaService.adicionarConsulta(criarConsulta(medico, pet, 1, [criarExame(1)]))
        await consultaService.adicionarConsulta(criarConsulta(medico, pet2, 2, [criarExame(2)]))

        expect(await exameService.listarPorPet(1)).toHaveLength(1)
        expect(await exameService.listarPorPet(2)).toHaveLength(1)
    })
})

describe('ReceitaService', () => {
    it('listarPorConsulta retorna receitas da consulta', async () => {
        const consulta = criarConsulta(medico, pet, 1, [], [criarReceita(1)])
        await consultaService.adicionarConsulta(consulta)
        expect(await receitaService.listarPorConsulta(1)).toHaveLength(1)
    })

    it('listarPorConsulta retorna lista vazia para consulta sem receitas', async () => {
        await consultaService.adicionarConsulta(criarConsulta(medico, pet, 1, [], []))
        expect(await receitaService.listarPorConsulta(1)).toHaveLength(0)
    })

    it('listarPorConsulta retorna lista vazia para consulta inexistente', async () => {
        expect(await receitaService.listarPorConsulta(99)).toHaveLength(0)
    })

    it('listarTodas retorna receitas de todas as consultas', async () => {
        await consultaService.adicionarConsulta(criarConsulta(medico, pet, 1, [], [criarReceita(1)]))
        await consultaService.adicionarConsulta(criarConsulta(medico, pet, 2, [], [criarReceita(2), criarReceita(3)]))
        expect(await receitaService.listarTodas()).toHaveLength(3)
    })

    it('buscarPorId encontra receita pelo id', async () => {
        await consultaService.adicionarConsulta(criarConsulta(medico, pet, 1, [], [criarReceita(99)]))
        expect((await receitaService.buscarPorId(99))?.id).toBe(99)
    })

    it('buscarPorId retorna undefined para id inexistente', async () => {
        expect(await receitaService.buscarPorId(99)).toBeUndefined()
    })

    it('listarPorPet retorna receitas do pet correto', async () => {
        const tutor2 = criarTutor(2)
        const pet2 = criarPet(tutor2, 2)
        const tutorService = new TutorService()
        const petService = new PetService()
        await tutorService.adicionarTutor(tutor2)
        await petService.adicionarPet(pet2)

        await consultaService.adicionarConsulta(criarConsulta(medico, pet, 1, [], [criarReceita(1)]))
        await consultaService.adicionarConsulta(criarConsulta(medico, pet2, 2, [], [criarReceita(2)]))

        expect(await receitaService.listarPorPet(1)).toHaveLength(1)
        expect(await receitaService.listarPorPet(2)).toHaveLength(1)
    })
})

describe('Exame model', () => {
    it('cria exame com dados corretos', () => {
        const data = new Date('2025-01-01')
        const exame = new Exame(1, 'Hemograma', data, 'Normal')
        expect(exame.id).toBe(1)
        expect(exame.nomeExame).toBe('Hemograma')
        expect(exame.dataExame).toEqual(data)
        expect(exame.resultado).toBe('Normal')
    })

    it('permite alterar resultado via setter', () => {
        const exame = criarExame()
        exame.resultado = 'Alterado'
        expect(exame.resultado).toBe('Alterado')
    })
})

describe('Receita model', () => {
    it('cria receita sem medicamentos por padrão', () => {
        const receita = new Receita(1)
        expect(receita.medicamentosReceitados).toHaveLength(0)
    })

    it('adicionarMedicamento inclui item na lista', () => {
        const receita = new Receita(1)
        receita.adicionarMedicamento(criarMedicamentoReceitado())
        expect(receita.medicamentosReceitados).toHaveLength(1)
    })

    it('removerMedicamento remove item da lista', () => {
        const item = criarMedicamentoReceitado()
        const receita = new Receita(1, [item])
        receita.removerMedicamento(item)
        expect(receita.medicamentosReceitados).toHaveLength(0)
    })

    it('medicamentosReceitados retorna cópia da lista', () => {
        const receita = new Receita(1, [criarMedicamentoReceitado()])
        const lista = receita.medicamentosReceitados
        lista.push(criarMedicamentoReceitado())
        expect(receita.medicamentosReceitados).toHaveLength(1)
    })
})

describe('MedicamentoReceitado model', () => {
    it('cria com todos os dados corretos', () => {
        const medicamento = criarMedicamento()
        const item = new MedicamentoReceitado(2, '10ml', 3, 5, medicamento, 'Com água')
        expect(item.quantidade).toBe(2)
        expect(item.dose).toBe('10ml')
        expect(item.vezesAoDia).toBe(3)
        expect(item.duracaoDias).toBe(5)
        expect(item.medicamento).toBe(medicamento)
        expect(item.observacao).toBe('Com água')
    })
})
