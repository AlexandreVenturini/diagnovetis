import { useCallback, useEffect, useState } from 'react'
import { Consulta, type ExameFisico, type Alta } from '../models/Consulta'
import { DiagnosticoZoonose } from '../models/DiagnosticoZoonose'
import { ExameService } from '../services/ExameService'
import type { ExamDraft } from '../features/consultations/examTypes'
import { ConsultaService } from '../services/ConsultaService'
import { MedicoService } from '../services/MedicoService'
import { PetService } from '../services/PetService'
import type { ConsultationData } from '../features/consultations/consultationTypes'
import type { PrescricaoSalva } from '../models/Prescricao'
import { validatePrescription } from '../features/consultations/prescriptionReport'

const consultaService = new ConsultaService()
const medicoService = new MedicoService()
const petService = new PetService()

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
    const encontrados = medicos.filter(m => m.nome.trim().toLocaleLowerCase('pt-BR') === nomeVeterinario.trim().toLocaleLowerCase('pt-BR'))
    return encontrados.length === 1 ? encontrados[0] : null
}

async function resolverPet(nomeCao: string, nomeTutor: string) {
    const pets = await petService.listarPets()

    const normalize = (value: string) => value.trim().toLocaleLowerCase('pt-BR')
    const encontrados = pets.filter(p => normalize(p.nome) === normalize(nomeCao) && normalize(p.tutor.nome) === normalize(nomeTutor))
    return encontrados.length === 1 ? encontrados[0] : null
}

export function useConsultas() {
    const [consultas, setConsultas] = useState<Consulta[]>([])

    const refresh = useCallback(() => consultaService.listarConsultas().then(setConsultas), [])

    useEffect(() => { void refresh().catch(() => {}) }, [refresh])

    async function salvarConsulta(data: ConsultationData, prescricao: PrescricaoSalva | null = null, exams: ExamDraft[] = []): Promise<{ sucesso: boolean; erro?: string; id?: number }> {
      try {
        if (prescricao) {
            const error = validatePrescription(data, prescricao.prescription)
            if (error) return { sucesso: false, erro: error }
        }
        const medico = await resolverMedico(data.veterinarian)
        if (!medico) return { sucesso: false, erro: 'Não foi possível identificar um único veterinário. Informe o nome completo cadastrado.' }

        const pet = await resolverPet(data.dogName, data.tutorName)
        if (!pet) return { sucesso: false, erro: 'Não foi possível identificar um único paciente. Confira o nome do animal e do tutor cadastrados.' }

            const exameFisico: ExameFisico = {
                temperatura: data.temperature ? parseFloat(data.temperature) : undefined,
                frequenciaCardiaca: data.heartRate ? parseFloat(data.heartRate) : undefined,
                frequenciaRespiratoria: data.respiratoryRate ? parseFloat(data.respiratoryRate) : undefined,
                tpc: data.capillaryRefill || undefined,
                mucosas: data.mucosa || undefined,
                hidratacao: data.hydration || undefined,
                nivelConsciencia: data.consciousness || undefined,
            }
            const alta: Alta = {}
            const consulta = new Consulta(
                await proximoId(),
                dataConsultaParaHoje(),
                new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                data.diagnosis ?? '',
                `Queixa: ${data.mainComplaint}. Histórico: ${data.history}`,
                medico,
                pet,
                new DiagnosticoZoonose(
                    data.zoonosisSearch ? 'suspeito' : 'negativo',
                    data.zoonosisSearch || 'Sem suspeita de zoonose',
                    new Date()
                ),
                new ExameService().criarSolicitacoes(exams),
                [],
                [],
                exameFisico,
                alta
            )
            consulta.conduta = data.conduct
            consulta.prescricao = prescricao
            await consultaService.adicionarConsulta(consulta)
            // Uma falha ao recarregar a lista não desfaz a consulta já gravada.
            void refresh().catch(() => {})
            return { sucesso: true, id: consulta.id }
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
