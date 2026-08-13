import { useCallback, useEffect, useState } from 'react'
import { Consulta } from '../models/Consulta'
import { DiagnosticoZoonose } from '../models/DiagnosticoZoonose'
import { ConsultaService } from '../services/ConsultaService'
import { MedicoService } from '../services/MedicoService'
import { PetService } from '../services/PetService'
import { TutorService } from '../services/TutorService'
import type { ConsultationData } from '../features/consultations/consultationTypes'

const consultaService = new ConsultaService()
const medicoService = new MedicoService()
const petService = new PetService()
const tutorService = new TutorService()

async function proximoId(): Promise<number> {
    const consultas = await consultaService.listarConsultas()
    return consultas.length > 0 ? Math.max(...consultas.map(c => c.id)) + 1 : 1
}

function dataConsultaParaHoje(): Date {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    return hoje
}

async function resolverMedico(nomeVeterinario: string) {
    const medicos = await medicoService.listarMedicos()
    return medicos.find(m => m.nome.toLowerCase().includes(nomeVeterinario.toLowerCase()))
        ?? medicos[0]
        ?? null
}

async function resolverPet(nomeCao: string, nomeTutor: string) {
    const pets = await petService.listarPets()

    const porNome = pets.find(p => p.nome.toLowerCase().includes(nomeCao.toLowerCase()))
    if (porNome) return porNome

    const tutores = await tutorService.buscarPorNome(nomeTutor)
    if (tutores.length > 0) {
        const petDoTutor = pets.find(p => p.tutor.id === tutores[0].id)
        if (petDoTutor) return petDoTutor
    }

    return pets[0] ?? null
}

export function useConsultas() {
    const [consultas, setConsultas] = useState<Consulta[]>([])

    const refresh = useCallback(async () => {
        const lista = await consultaService.listarConsultas()
        setConsultas(lista)
    }, [])

    useEffect(() => { refresh() }, [refresh])

    async function salvarConsulta(data: ConsultationData): Promise<{ sucesso: boolean; erro?: string }> {
        const medico = await resolverMedico(data.veterinarian)
        if (!medico) return { sucesso: false, erro: 'Nenhum médico cadastrado.' }

        const pet = await resolverPet(data.dogName, data.tutorName)
        if (!pet) return { sucesso: false, erro: 'Nenhum paciente encontrado.' }

        try {
            const consulta = new Consulta(
                await proximoId(),
                dataConsultaParaHoje(),
                new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                data.conduct,
                `Queixa: ${data.mainComplaint}. Histórico: ${data.history}`,
                medico,
                pet,
                new DiagnosticoZoonose(
                    data.zoonosisSearch ? 'suspeito' : 'negativo',
                    data.zoonosisSearch || 'Sem suspeita de zoonose',
                    new Date()
                )
            )
            await consultaService.adicionarConsulta(consulta)
            await refresh()
            return { sucesso: true }
        } catch (e) {
            return { sucesso: false, erro: (e as Error).message }
        }
    }

    async function listarPorPet(petId: number) {
        return consultaService.listarPorPet(petId)
    }

    async function listarPorMedico(medicoId: number) {
        return consultaService.listarPorMedico(medicoId)
    }

    return { consultas, salvarConsulta, listarPorPet, listarPorMedico }
}
