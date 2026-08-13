import { describe, it, expect, beforeEach } from 'vitest'
import './setup'
import { Consulta } from '../models/Consulta'
import { DiagnosticoZoonose } from '../models/DiagnosticoZoonose'
import { Endereco } from '../models/Endereco'
import { Medico } from '../models/Medico'
import { Pet } from '../models/Pet'
import { Tutor } from '../models/Tutor'
import { Aluno } from '../models/Aluno'
import { ConsultaService } from '../services/ConsultaService'
import { MedicoService } from '../services/MedicoService'
import { TutorService } from '../services/TutorService'
import { PetService } from '../services/PetService'
import { AlunoService } from '../services/AlunoService'
import { ValidacaoError } from '../services/validation/ValidacaoError'

function criarMedico(id = 1): Medico {
    return new Medico(id, 'Dr. Silva', '27933001234', 'silva@vet.com', 'Clínica Geral', '12345-ES')
}

function criarTutor(id = 1): Tutor {
    return new Tutor(id, 'Ana Costa', '27933001234', 'ana@email.com', new Date('2024-01-01'), new Endereco('Rua A', 1, 'Bairro', 'Vitória', 'ES', '29010100'))
}

function criarPet(tutor: Tutor, id = 1): Pet {
    return new Pet(id, 'Rex', 'Cão', 'Labrador', tutor)
}

function criarAluno(medico: Medico, id = 1): Aluno {
    return new Aluno(id, 'Maria', '27911112222', 'maria@ifes.edu.br', '20221001', 3, 'Medicina Veterinária', medico)
}

function criarDiagnostico(): DiagnosticoZoonose {
    return new DiagnosticoZoonose('negativo', 'Sem sinais', new Date())
}

function dataFutura(dias = 1): Date {
    const data = new Date()
    data.setDate(data.getDate() + dias)
    return data
}

function novaConsulta(medico: Medico, pet: Pet, id = 1): Consulta {
    return new Consulta(id, dataFutura(), '09:00', 'Diagnóstico inicial', 'Nenhuma', medico, pet, criarDiagnostico())
}

let service: ConsultaService
let medicoService: MedicoService
let tutorService: TutorService
let petService: PetService
let alunoService: AlunoService
let medico: Medico
let tutor: Tutor
let pet: Pet

beforeEach(async () => {
    service = new ConsultaService()
    medicoService = new MedicoService()
    tutorService = new TutorService()
    petService = new PetService()
    alunoService = new AlunoService()

    medico = criarMedico()
    tutor = criarTutor()
    pet = criarPet(tutor)

    await medicoService.adicionarMedico(medico)
    await tutorService.adicionarTutor(tutor)
    await petService.adicionarPet(pet)
})

describe('ConsultaService.adicionarConsulta', () => {
    it('adiciona consulta válida com sucesso', async () => {
        await service.adicionarConsulta(novaConsulta(medico, pet))
        expect(await service.listarConsultas()).toHaveLength(1)
    })

    it('vincula consulta ao pet após adicionar', async () => {
        const consulta = novaConsulta(medico, pet)
        await service.adicionarConsulta(consulta)
        expect(pet.historicoConsulta).toHaveLength(1)
    })

    it('lança erro para id duplicado', async () => {
        await service.adicionarConsulta(novaConsulta(medico, pet, 1))
        await expect(service.adicionarConsulta(novaConsulta(medico, pet, 1))).rejects.toThrow(ValidacaoError)
    })

    it('lança erro para data no passado', async () => {
        const ontem = new Date()
        ontem.setDate(ontem.getDate() - 1)
        const consulta = new Consulta(1, ontem, '09:00', 'Diagnóstico', 'Nenhuma', medico, pet, criarDiagnostico())
        await expect(service.adicionarConsulta(consulta)).rejects.toThrow(ValidacaoError)
    })

    it('lança erro para horário vazio', async () => {
        const consulta = new Consulta(1, dataFutura(), '', 'Diagnóstico', 'Nenhuma', medico, pet, criarDiagnostico())
        await expect(service.adicionarConsulta(consulta)).rejects.toThrow(ValidacaoError)
    })

    it('aceita consulta para hoje', async () => {
        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)
        const consulta = new Consulta(1, hoje, '09:00', 'Diagnóstico', 'Nenhuma', medico, pet, criarDiagnostico())
        await expect(service.adicionarConsulta(consulta)).resolves.not.toThrow()
    })
})

describe('ConsultaService.buscarPorId', () => {
    it('retorna consulta existente', async () => {
        await service.adicionarConsulta(novaConsulta(medico, pet))
        expect((await service.buscarPorId(1))?.horario).toBe('09:00')
    })

    it('retorna undefined para id inexistente', async () => {
        expect(await service.buscarPorId(99)).toBeUndefined()
    })
})

describe('ConsultaService.listarPorPet', () => {
    it('retorna consultas do pet correto', async () => {
        const tutor2 = criarTutor(2)
        const pet2 = criarPet(tutor2, 2)
        await tutorService.adicionarTutor(tutor2)
        await petService.adicionarPet(pet2)

        await service.adicionarConsulta(novaConsulta(medico, pet, 1))
        await service.adicionarConsulta(new Consulta(2, dataFutura(2), '10:00', 'Diag', 'Obs', medico, pet2, criarDiagnostico()))

        expect(await service.listarPorPet(1)).toHaveLength(1)
        expect(await service.listarPorPet(2)).toHaveLength(1)
    })
})

describe('ConsultaService.listarPorMedico', () => {
    it('retorna consultas do médico correto', async () => {
        const medico2 = criarMedico(2)
        await medicoService.adicionarMedico(medico2)

        await service.adicionarConsulta(novaConsulta(medico, pet, 1))
        await service.adicionarConsulta(new Consulta(2, dataFutura(2), '10:00', 'Diag', 'Obs', medico2, pet, criarDiagnostico()))

        expect(await service.listarPorMedico(1)).toHaveLength(1)
        expect(await service.listarPorMedico(2)).toHaveLength(1)
    })
})

describe('ConsultaService.listarPorData', () => {
    it('retorna consultas da data correta', async () => {
        const amanha = dataFutura(1)
        const depoisDeAmanha = dataFutura(2)

        await service.adicionarConsulta(new Consulta(1, amanha, '09:00', 'Diag', 'Obs', medico, pet, criarDiagnostico()))
        await service.adicionarConsulta(new Consulta(2, depoisDeAmanha, '10:00', 'Diag', 'Obs', medico, pet, criarDiagnostico()))

        expect(await service.listarPorData(amanha)).toHaveLength(1)
    })
})

describe('ConsultaService.listarPorAluno', () => {
    it('retorna consultas em que o aluno participou', async () => {
        const aluno = criarAluno(medico)
        await alunoService.adicionarAluno(aluno)

        const consulta = novaConsulta(medico, pet)
        consulta.adicionarAluno(aluno)
        await service.adicionarConsulta(consulta)

        expect(await service.listarPorAluno(1)).toHaveLength(1)
    })

    it('não retorna consultas sem o aluno', async () => {
        await service.adicionarConsulta(novaConsulta(medico, pet))
        expect(await service.listarPorAluno(1)).toHaveLength(0)
    })
})
