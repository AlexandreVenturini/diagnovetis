import { Consulta, type ExameFisico, type Alta, type ParticipanteConsulta } from '../models/Consulta'
import { DiagnosticoZoonose } from '../models/DiagnosticoZoonose'
import { linhaParaExame, exameParaLinha, type ExameRow } from './storage/mapeamentoExame'
import { Medico } from '../models/Medico'
import { supabase } from './storage/supabaseClient'
import { PetService } from './PetService'
import { validarObrigatorio, validarDataFutura, validarIdUnico } from './validation/validadores'
import { dataParaCampo, fimIntervaloIso, inicioIntervaloIso, type Intervalo } from '../features/shared/periodo'

const petService = new PetService()

export type ResumoConsulta = { id: number; petId: number; data: string; veterinario: string }

interface MedicoRow {
  id: number
  nome: string
  telefone: string
  email: string
  especialidade: string
  crmv: string
}
interface ParticipanteRow {
  profile_id: string
  papel: ParticipanteConsulta['papel']
  nome: string
}
interface ConsultaRow {
  versao?: number
  retificado_em?: string | null
  retificado_por_nome?: string | null
  supervisor_id?: string | null
  liberacao_id?: string | null
  conduta?: string
  id: number
  data_consulta: string
  horario: string
  diagnostico: string
  observacoes: string
  responsavel_id: number
  pet_id: number
  diagnostico_zoonose_status: string
  diagnostico_zoonose_observacoes: string
  diagnostico_zoonose_data_confirmacao: string
  medicos: MedicoRow
  temperatura?: number
  frequencia_cardiaca?: number
  frequencia_respiratoria?: number
  tpc?: string
  mucosas?: string
  hidratacao?: string
  nivel_consciencia?: string
  pele_pelagem?: string
  olhos?: string
  ouvidos?: string
  boca_dentes?: string
  sistema_respiratorio?: string
  sistema_cardiovascular?: string
  sistema_gastrointestinal?: string
  sistema_urinario?: string
  sistema_reprodutivo?: string
  sistema_neurologico?: string
  dor?: string
  alta_data?: string
  alta_condicao?: string
  alta_orientacoes?: string
  alta_prognostico?: string
}

function agruparPorConsulta<T extends { consulta_id: number }>(linhas: T[]): Map<number, T[]> {
  const mapa = new Map<number, T[]>()
  for (const linha of linhas) {
    const lista = mapa.get(linha.consulta_id) ?? []
    lista.push(linha)
    mapa.set(linha.consulta_id, lista)
  }
  return mapa
}

async function carregarConsultas(linhas: ConsultaRow[]): Promise<Consulta[]> {
  if (linhas.length === 0) return []
  const ids = linhas.map((r) => r.id)

  const [pets, resultadoExames, resultadoParticipantes] = await Promise.all([
    petService.listarPorIds([...new Set(linhas.map((r) => r.pet_id))]),
    supabase.from('exames').select('*').in('consulta_id', ids),
    supabase.from('consulta_participantes').select('consulta_id, profile_id, papel, nome').in('consulta_id', ids),
  ])
  if (resultadoExames.error) throw new Error(resultadoExames.error.message)

  const petsPorId = new Map(pets.map((p) => [p.id, p]))
  const examesPorConsulta = agruparPorConsulta((resultadoExames.data ?? []) as (ExameRow & { consulta_id: number })[])
  const participantesPorConsulta = agruparPorConsulta(
    (resultadoParticipantes.data ?? []) as (ParticipanteRow & { consulta_id: number })[],
  )

  const consultas: Consulta[] = []
  for (const linha of linhas) {
    const pet = petsPorId.get(linha.pet_id)
    if (!pet) continue

    const m = linha.medicos
    const responsavel = new Medico(m.id, m.nome, m.telefone, m.email, m.especialidade, m.crmv)
    const exames = (examesPorConsulta.get(linha.id) ?? []).map(linhaParaExame)
    const participantes = participantesPorConsulta.get(linha.id) ?? []

    const diagnosticoZoonose = new DiagnosticoZoonose(
      linha.diagnostico_zoonose_status,
      linha.diagnostico_zoonose_observacoes,
      new Date(linha.diagnostico_zoonose_data_confirmacao),
    )

    const exameFisico: ExameFisico = {
      temperatura: linha.temperatura ?? undefined,
      frequenciaCardiaca: linha.frequencia_cardiaca ?? undefined,
      frequenciaRespiratoria: linha.frequencia_respiratoria ?? undefined,
      tpc: linha.tpc ?? undefined,
      mucosas: linha.mucosas ?? undefined,
      hidratacao: linha.hidratacao ?? undefined,
      nivelConsciencia: linha.nivel_consciencia ?? undefined,
      pelePelagem: linha.pele_pelagem ?? undefined,
      olhos: linha.olhos ?? undefined,
      ouvidos: linha.ouvidos ?? undefined,
      bocaDentes: linha.boca_dentes ?? undefined,
      sistemaRespiratorio: linha.sistema_respiratorio ?? undefined,
      sistemaCardiovascular: linha.sistema_cardiovascular ?? undefined,
      sistemaGastrointestinal: linha.sistema_gastrointestinal ?? undefined,
      sistemaUrinario: linha.sistema_urinario ?? undefined,
      sistemaReprodutivo: linha.sistema_reprodutivo ?? undefined,
      sistemaNeurologico: linha.sistema_neurologico ?? undefined,
      dor: linha.dor ?? undefined,
    }
    const alta: Alta = {
      dados: linha.alta_data ?? undefined,
      condicao: linha.alta_condicao ?? undefined,
      orientacoes: linha.alta_orientacoes ?? undefined,
      prognostico: linha.alta_prognostico ?? undefined,
    }

    const consulta = new Consulta(
      linha.id,
      new Date(linha.data_consulta),
      linha.horario,
      linha.diagnostico,
      linha.observacoes,
      responsavel,
      pet,
      diagnosticoZoonose,
      exames,
      exameFisico,
      alta,
    )
    consulta.conduta = linha.conduta ?? ''
    consulta.participantes = participantes.map((p) => ({ nome: p.nome, papel: p.papel }))
    consulta.supervisorNome = participantes.find((p) => p.profile_id === linha.supervisor_id)?.nome ?? ''
    consulta.liberacaoId = linha.liberacao_id ?? null
    consulta.versao = linha.versao ?? 1
    consulta.retificadoEm = linha.retificado_em ? new Date(linha.retificado_em) : null
    consulta.retificadoPorNome = linha.retificado_por_nome ?? ''
    consultas.push(consulta)
  }
  return consultas
}

export class ConsultaService {
  async listarResumo(intervalo: Intervalo | null = null): Promise<ResumoConsulta[]> {
    let busca = supabase
      .from('consultas')
      .select('id, pet_id, data_consulta, responsavel_id, medicos!responsavel_id(*)')
    if (intervalo)
      busca = busca.gte('data_consulta', inicioIntervaloIso(intervalo)).lte('data_consulta', fimIntervaloIso(intervalo))
    const { data: dados, error: erro } = await busca
    if (erro) throw new Error(erro.message)
    return (
      (dados ?? []) as unknown as { id: number; pet_id: number; data_consulta: string; medicos: MedicoRow | null }[]
    ).map((r) => ({
      id: r.id,
      petId: r.pet_id,
      data: dataParaCampo(new Date(r.data_consulta)),
      veterinario: r.medicos?.nome ?? '',
    }))
  }

  async proximoId(): Promise<number> {
    const { data: dados, error: erro } = await supabase
      .from('consultas')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
    if (erro) throw new Error(erro.message)
    const ultimo = ((dados ?? []) as { id: number }[])[0]
    return ultimo ? ultimo.id + 1 : 1
  }

  async adicionarConsulta(consulta: Consulta): Promise<void> {
    const { data: existente, error: erroId } = await supabase.from('consultas').select('id').eq('id', consulta.id)
    if (erroId) throw new Error(erroId.message)
    validarIdUnico(consulta.id, (existente ?? []) as { id: number }[], 'consulta')
    validarDataFutura(consulta.dataConsulta, 'dataConsulta')
    validarObrigatorio(consulta.horario, 'horario')

    const linhaConsulta = {
      id: consulta.id,
      data_consulta: consulta.dataConsulta.toISOString(),
      horario: consulta.horario,
      diagnostico: consulta.diagnostico,
      ...(consulta.conduta ? { conduta: consulta.conduta } : {}),
      ...(consulta.liberacaoId ? { liberacao_id: consulta.liberacaoId } : {}),
      observacoes: consulta.observacoes,
      responsavel_id: consulta.responsavel.id,
      pet_id: consulta.pet.id,
      diagnostico_zoonose_status: consulta.diagnosticoZoonose.status,
      diagnostico_zoonose_observacoes: consulta.diagnosticoZoonose.observacoes,
      diagnostico_zoonose_data_confirmacao: consulta.diagnosticoZoonose.dataConfirmacao.toISOString(),
      temperatura: consulta.exameFisico.temperatura ?? null,
      frequencia_cardiaca: consulta.exameFisico.frequenciaCardiaca ?? null,
      frequencia_respiratoria: consulta.exameFisico.frequenciaRespiratoria ?? null,
      tpc: consulta.exameFisico.tpc ?? null,
      mucosas: consulta.exameFisico.mucosas ?? null,
      hidratacao: consulta.exameFisico.hidratacao ?? null,
      nivel_consciencia: consulta.exameFisico.nivelConsciencia ?? null,
      pele_pelagem: consulta.exameFisico.pelePelagem ?? null,
      olhos: consulta.exameFisico.olhos ?? null,
      ouvidos: consulta.exameFisico.ouvidos ?? null,
      boca_dentes: consulta.exameFisico.bocaDentes ?? null,
      sistema_respiratorio: consulta.exameFisico.sistemaRespiratorio ?? null,
      sistema_cardiovascular: consulta.exameFisico.sistemaCardiovascular ?? null,
      sistema_gastrointestinal: consulta.exameFisico.sistemaGastrointestinal ?? null,
      sistema_urinario: consulta.exameFisico.sistemaUrinario ?? null,
      sistema_reprodutivo: consulta.exameFisico.sistemaReprodutivo ?? null,
      sistema_neurologico: consulta.exameFisico.sistemaNeurologico ?? null,
      dor: consulta.exameFisico.dor ?? null,
      alta_data: consulta.alta.dados ?? null,
      alta_condicao: consulta.alta.condicao ?? null,
      alta_orientacoes: consulta.alta.orientacoes ?? null,
      alta_prognostico: consulta.alta.prognostico ?? null,
    }
    const { error: erro } = consulta.exames.length
      ? await supabase.rpc('salvar_consulta_com_exames', {
          p_consulta: linhaConsulta,
          p_exames: consulta.exames.map(exameParaLinha),
        })
      : await supabase.from('consultas').insert(linhaConsulta)
    if (erro) {
      if (erro.message.includes('óbito'))
        throw new Error('Este animal tem óbito registrado; não é possível registrar novos atendimentos para ele.')
      if (erro.message.includes('liberação'))
        throw new Error(
          'A liberação do professor não é mais válida. Peça uma nova liberação para salvar o atendimento. Os dados foram mantidos.',
        )
      if (consulta.exames.length)
        throw new Error(
          'Não foi possível confirmar a gravação da consulta com exames. Confira a conexão e a migração de exames complementares. Os dados foram mantidos.',
        )
      throw new Error(erro.message)
    }

    consulta.pet.adicionarConsulta(consulta)
  }

  async buscarPorId(id: number): Promise<Consulta | undefined> {
    const { data: dados, error: erro } = await supabase
      .from('consultas')
      .select('*, medicos!responsavel_id(*)')
      .eq('id', id)
      .single()
    if (erro || !dados) return undefined
    return (await carregarConsultas([dados as ConsultaRow]))[0]
  }

  async listarPorPet(petId: number): Promise<Consulta[]> {
    const { data: dados, error: erro } = await supabase
      .from('consultas')
      .select('*, medicos!responsavel_id(*)')
      .eq('pet_id', petId)
    if (erro) throw new Error(erro.message)
    return carregarConsultas((dados ?? []) as ConsultaRow[])
  }
}
