import { Consulta, type ExameFisico, type Alta } from '../models/Consulta'
import { DiagnosticoZoonose } from '../models/DiagnosticoZoonose'
import { ExameService } from '../services/ExameService'
import type { ExamDraft } from '../features/consultations/examTypes'
import { ConsultaService } from '../services/ConsultaService'
import { MedicoService } from '../services/MedicoService'
import { PetService } from '../services/PetService'
import type { ConsultationData } from '../features/consultations/consultationTypes'

const consultaService = new ConsultaService()
const medicoService = new MedicoService()
const petService = new PetService()

function dataConsultaParaHoje(): Date {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  return hoje
}

async function resolverMedico(nomeVeterinario: string, medicoId?: number) {
  const medicos = await medicoService.listarMedicos()
  if (medicoId) return medicos.find((m) => m.id === medicoId) ?? null
  const encontrados = medicos.filter(
    (m) => m.nome.trim().toLocaleLowerCase('pt-BR') === nomeVeterinario.trim().toLocaleLowerCase('pt-BR'),
  )
  return encontrados.length === 1 ? encontrados[0] : null
}

async function resolverPet(nomeCao: string, nomeTutor: string) {
  const pets = await petService.listarPets()

  const normalize = (value: string) => value.trim().toLocaleLowerCase('pt-BR')
  const encontrados = pets.filter(
    (p) => normalize(p.nome) === normalize(nomeCao) && normalize(p.tutor.nome) === normalize(nomeTutor),
  )
  return encontrados.length === 1 ? encontrados[0] : null
}

export function useConsultas() {
  async function salvarConsulta(
    data: ConsultationData,
    exams: ExamDraft[] = [],
    liberacaoId: string | null = null,
  ): Promise<{ sucesso: boolean; erro?: string; id?: number; petId?: number }> {
    try {
      const medico = await resolverMedico(data.veterinarian, Number(data.veterinarianId) || undefined)
      if (!medico)
        return {
          sucesso: false,
          erro: 'Não foi possível identificar o veterinário. Selecione um veterinário da lista.',
        }

      const pet = await resolverPet(data.dogName, data.tutorName)
      if (!pet)
        return {
          sucesso: false,
          erro: 'Não foi possível identificar um único paciente. Confira o nome do animal e do tutor cadastrados.',
        }

      const exameFisico: ExameFisico = {
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
      const alta: Alta = {
        data: data.dischargeDate || undefined,
        condicao: data.dischargeCondition || undefined,
        orientacoes: data.dischargeInstructions || undefined,
        prognostico: data.dischargePrognosis || undefined,
      }
      const consulta = new Consulta(
        await consultaService.proximoId(),
        dataConsultaParaHoje(),
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
        new ExameService().criarSolicitacoes(exams),
        exameFisico,
        alta,
      )
      consulta.conduta = data.conduct
      consulta.liberacaoId = liberacaoId
      await consultaService.adicionarConsulta(consulta)
      return { sucesso: true, id: consulta.id, petId: pet.id }
    } catch (e) {
      return { sucesso: false, erro: (e as Error).message }
    }
  }

  return { salvarConsulta }
}
