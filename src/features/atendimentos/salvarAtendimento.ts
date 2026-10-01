import { Consulta, type Alta, type ExameFisico } from '../../models/Consulta'
import { DiagnosticoZoonose } from '../../models/DiagnosticoZoonose'
import type { Medico } from '../../models/Medico'
import type { Pet } from '../../models/Pet'
import { ConsultaService } from '../../services/ConsultaService'
import { ExameService } from '../../services/ExameService'
import { MedicoService } from '../../services/MedicoService'
import { PetService } from '../../services/PetService'
import type { DadosAtendimento } from './atendimentoTipos'
import type { RascunhoExame } from './exameTipos'

const consultaService = new ConsultaService()
const medicoService = new MedicoService()
const petService = new PetService()
const exameService = new ExameService()

export type ResultadoSalvar = { sucesso: boolean; erro?: string; id?: number; petId?: number }

const normalizar = (valor: string) => valor.trim().toLocaleLowerCase('pt-BR')

function hojeSemHorario(): Date {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  return hoje
}

async function resolverMedico(nomeVeterinario: string, medicoId?: number) {
  const medicos = await medicoService.listarMedicos()
  if (medicoId) return medicos.find((m) => m.id === medicoId) ?? null
  const encontrados = medicos.filter((m) => normalizar(m.nome) === normalizar(nomeVeterinario))
  return encontrados.length === 1 ? encontrados[0] : null
}

async function resolverPet(nomeCao: string, nomeTutor: string) {
  const pets = await petService.listarPets()
  const encontrados = pets.filter(
    (p) => normalizar(p.nome) === normalizar(nomeCao) && normalizar(p.tutor.nome) === normalizar(nomeTutor),
  )
  return encontrados.length === 1 ? encontrados[0] : null
}

function paraExameFisico(dados: DadosAtendimento): ExameFisico {
  return {
    temperatura: dados.temperatura ? parseFloat(dados.temperatura) : undefined,
    frequenciaCardiaca: dados.frequenciaCardiaca ? parseFloat(dados.frequenciaCardiaca) : undefined,
    frequenciaRespiratoria: dados.frequenciaRespiratoria ? parseFloat(dados.frequenciaRespiratoria) : undefined,
    tpc: dados.tpc || undefined,
    mucosas: dados.mucosas || undefined,
    hidratacao: dados.hidratacao || undefined,
    nivelConsciencia: dados.nivelConsciencia || undefined,
    pelePelagem: dados.pelePelagem || undefined,
    olhos: dados.olhos || undefined,
    ouvidos: dados.ouvidos || undefined,
    bocaDentes: dados.bocaDentes || undefined,
    sistemaRespiratorio: dados.sistemaRespiratorio || undefined,
    sistemaCardiovascular: dados.sistemaCardiovascular || undefined,
    sistemaGastrointestinal: dados.sistemaGastrointestinal || undefined,
    sistemaUrinario: dados.sistemaUrinario || undefined,
    sistemaReprodutivo: dados.sistemaReprodutivo || undefined,
    sistemaNeurologico: dados.sistemaNeurologico || undefined,
    dor: dados.dor || undefined,
  }
}

function paraAlta(dados: DadosAtendimento): Alta {
  return {
    dados: dados.dataAlta || undefined,
    condicao: dados.condicaoAlta || undefined,
    orientacoes: dados.orientacoesAlta || undefined,
    prognostico: dados.prognosticoAlta || undefined,
  }
}

function paraConsulta(
  id: number,
  dados: DadosAtendimento,
  exames: RascunhoExame[],
  medico: Medico,
  pet: Pet,
): Consulta {
  const consulta = new Consulta(
    id,
    hojeSemHorario(),
    new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    dados.diagnostico ?? '',
    `Queixa: ${dados.queixaPrincipal}. Histórico: ${dados.historico}`,
    medico,
    pet,
    new DiagnosticoZoonose(
      dados.suspeitaZoonose ? 'suspeito' : 'negativo',
      dados.suspeitaZoonose || 'Sem suspeita de zoonose',
      new Date(),
    ),
    exameService.criarSolicitacoes(exames),
    paraExameFisico(dados),
    paraAlta(dados),
  )
  consulta.conduta = dados.conduta
  return consulta
}

export async function salvarConsulta(
  dados: DadosAtendimento,
  exames: RascunhoExame[] = [],
  liberacaoId: string | null = null,
): Promise<ResultadoSalvar> {
  try {
    const medico = await resolverMedico(dados.veterinario, Number(dados.veterinarioId) || undefined)
    if (!medico)
      return { sucesso: false, erro: 'Não foi possível identificar o veterinário. Selecione um veterinário da lista.' }

    const pet = await resolverPet(dados.nomePet, dados.nomeTutor)
    if (!pet)
      return {
        sucesso: false,
        erro: 'Não foi possível identificar um único paciente. Confira o nome do animal e do tutor cadastrados.',
      }

    const consulta = paraConsulta(await consultaService.proximoId(), dados, exames, medico, pet)
    consulta.liberacaoId = liberacaoId
    await consultaService.adicionarConsulta(consulta)
    return { sucesso: true, id: consulta.id, petId: pet.id }
  } catch (erro) {
    return { sucesso: false, erro: (erro as Error).message }
  }
}
