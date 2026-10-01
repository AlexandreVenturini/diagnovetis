import { Consulta, type Alta, type ExameFisico } from '../../models/Consulta'
import { DiagnosticoZoonose } from '../../models/DiagnosticoZoonose'
import type { Medico } from '../../models/Medico'
import type { Pet } from '../../models/Pet'
import { ConsultaService } from '../../services/ConsultaService'
import { ExameService } from '../../services/ExameService'
import { MedicoService } from '../../services/MedicoService'
import { PetService } from '../../services/PetService'
import type { DadosAtendimento } from './atendimentoTipos'
import { consultaParaDados } from './consultaParaDados'
import { exameParaRascunho, type RascunhoExame } from './exameTipos'

const consultaService = new ConsultaService()
const medicoService = new MedicoService()
const petService = new PetService()
const exameService = new ExameService()

export type ResultadoSalvar = { sucesso: boolean; erro?: string; id?: number; petId?: number }

export type InicioAtendimento = { data: Date; horario: string }

export type OpcoesSalvar = {
  idRascunho: number | null
  inicio: InicioAtendimento | null
  liberacaoId: string | null
  participantes: string[]
  agendamentoId: number | null
  finalizar: boolean
}

export type RascunhoCarregado = {
  id: number
  dados: DadosAtendimento
  exames: RascunhoExame[]
  participantes: string[]
  agendamentoId: number | null
  inicio: InicioAtendimento
  supervisorNome: string
}

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

export function agoraComoInicio(): InicioAtendimento {
  return {
    data: hojeSemHorario(),
    horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  }
}

function paraConsulta(
  dados: DadosAtendimento,
  exames: RascunhoExame[],
  medico: Medico,
  pet: Pet,
  inicio: InicioAtendimento,
): Consulta {
  const consulta = new Consulta(
    0,
    inicio.data,
    inicio.horario,
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
  exames: RascunhoExame[],
  opcoes: OpcoesSalvar,
): Promise<ResultadoSalvar> {
  try {
    const medico = await resolverMedico(dados.veterinario, Number(dados.veterinarioId) || undefined)
    if (!medico)
      return { sucesso: false, erro: 'Não foi possível identificar o veterinário. Selecione um veterinário da lista.' }

    const pet = await resolverPet(dados.nomePet, dados.nomeTutor)
    if (!pet)
      return {
        sucesso: false,
        erro: 'Não foi possível identificar um único paciente. Confira o nome do animal e do responsável cadastrados.',
      }

    const consulta = paraConsulta(dados, exames, medico, pet, opcoes.inicio ?? agoraComoInicio())
    consulta.liberacaoId = opcoes.liberacaoId
    const id = await consultaService.salvarAtendimento(consulta, {
      id: opcoes.idRascunho,
      finalizar: opcoes.finalizar,
      participantes: opcoes.participantes,
      agendamentoId: opcoes.agendamentoId,
    })
    return { sucesso: true, id, petId: pet.id }
  } catch (erro) {
    return { sucesso: false, erro: (erro as Error).message }
  }
}

export async function carregarRascunho(id: number): Promise<RascunhoCarregado> {
  const consulta = await consultaService.buscarPorId(id)
  if (!consulta || consulta.situacao !== 'aberto')
    throw new Error('Este atendimento não está mais em andamento. Ele pode ter sido finalizado ou descartado.')
  return {
    id: consulta.id,
    dados: consultaParaDados(consulta),
    exames: consulta.exames.map(exameParaRascunho),
    participantes: consulta.participantes.filter((p) => p.papel === 'participante').map((p) => p.idPerfil),
    agendamentoId: consulta.agendamentoId,
    inicio: { data: consulta.dataConsulta, horario: consulta.horario },
    supervisorNome: consulta.supervisorNome,
  }
}

export async function descartarRascunho(id: number): Promise<void> {
  await consultaService.descartarAtendimento(id)
}

export function listarEmAndamento() {
  return consultaService.listarEmAndamento()
}
