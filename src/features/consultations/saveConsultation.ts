import { Consulta, type Alta, type ExameFisico } from '../../models/Consulta'
import { DiagnosticoZoonose } from '../../models/DiagnosticoZoonose'
import type { Medico } from '../../models/Medico'
import type { Pet } from '../../models/Pet'
import { ConsultaService } from '../../services/ConsultaService'
import { ExameService } from '../../services/ExameService'
import { MedicoService } from '../../services/MedicoService'
import { PetService } from '../../services/PetService'
import type { ConsultationData } from './consultationTypes'
import type { ExamDraft } from './examTypes'

const consultaService = new ConsultaService()
const medicoService = new MedicoService()
const petService = new PetService()
const exameService = new ExameService()

export type SaveResult = { sucesso: boolean; erro?: string; id?: number; petId?: number }

const normalize = (value: string) => value.trim().toLocaleLowerCase('pt-BR')

function hojeSemHorario(): Date {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  return hoje
}

async function resolverMedico(nomeVeterinario: string, medicoId?: number) {
  const medicos = await medicoService.listarMedicos()
  if (medicoId) return medicos.find((m) => m.id === medicoId) ?? null
  const encontrados = medicos.filter((m) => normalize(m.nome) === normalize(nomeVeterinario))
  return encontrados.length === 1 ? encontrados[0] : null
}

async function resolverPet(nomeCao: string, nomeTutor: string) {
  const pets = await petService.listarPets()
  const encontrados = pets.filter(
    (p) => normalize(p.nome) === normalize(nomeCao) && normalize(p.tutor.nome) === normalize(nomeTutor),
  )
  return encontrados.length === 1 ? encontrados[0] : null
}

function toExameFisico(data: ConsultationData): ExameFisico {
  return {
    temperatura: data.temperature ? parseFloat(data.temperature) : undefined,
    frequenciaCardiaca: data.heartRate ? parseFloat(data.heartRate) : undefined,
    frequenciaRespiratoria: data.respiratoryRate ? parseFloat(data.respiratoryRate) : undefined,
    tpc: data.capillaryRefill || undefined,
    mucosas: data.mucosa || undefined,
    hidratacao: data.hydration || undefined,
    nivelConsciencia: data.consciousness || undefined,
    pelePelagem: data.skinAndCoat || undefined,
    olhos: data.eyes || undefined,
    ouvidos: data.ears || undefined,
    bocaDentes: data.mouthAndTeeth || undefined,
    sistemaRespiratorio: data.respiratorySystem || undefined,
    sistemaCardiovascular: data.cardiovascularSystem || undefined,
    sistemaGastrointestinal: data.gastrointestinalSystem || undefined,
    sistemaUrinario: data.urinarySystem || undefined,
    sistemaReprodutivo: data.reproductiveSystem || undefined,
    sistemaNeurologico: data.neurologicalSystem || undefined,
    dor: data.pain || undefined,
  }
}

function toAlta(data: ConsultationData): Alta {
  return {
    data: data.dischargeDate || undefined,
    condicao: data.dischargeCondition || undefined,
    orientacoes: data.dischargeInstructions || undefined,
    prognostico: data.dischargePrognosis || undefined,
  }
}

function toConsulta(id: number, data: ConsultationData, exams: ExamDraft[], medico: Medico, pet: Pet): Consulta {
  const consulta = new Consulta(
    id,
    hojeSemHorario(),
    new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    data.diagnosis ?? '',
    `Queixa: ${data.mainComplaint}. Histórico: ${data.history}`,
    medico,
    pet,
    new DiagnosticoZoonose(
      data.zoonosisSearch ? 'suspeito' : 'negativo',
      data.zoonosisSearch || 'Sem suspeita de zoonose',
      new Date(),
    ),
    exameService.criarSolicitacoes(exams),
    toExameFisico(data),
    toAlta(data),
  )
  consulta.conduta = data.conduct
  return consulta
}

export async function salvarConsulta(
  data: ConsultationData,
  exams: ExamDraft[] = [],
  liberacaoId: string | null = null,
): Promise<SaveResult> {
  try {
    const medico = await resolverMedico(data.veterinarian, Number(data.veterinarianId) || undefined)
    if (!medico)
      return { sucesso: false, erro: 'Não foi possível identificar o veterinário. Selecione um veterinário da lista.' }

    const pet = await resolverPet(data.dogName, data.tutorName)
    if (!pet)
      return {
        sucesso: false,
        erro: 'Não foi possível identificar um único paciente. Confira o nome do animal e do tutor cadastrados.',
      }

    const consulta = toConsulta(await consultaService.proximoId(), data, exams, medico, pet)
    consulta.liberacaoId = liberacaoId
    await consultaService.adicionarConsulta(consulta)
    return { sucesso: true, id: consulta.id, petId: pet.id }
  } catch (error) {
    return { sucesso: false, erro: (error as Error).message }
  }
}
