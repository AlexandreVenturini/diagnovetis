import { Consulta, type ExameFisico, type Alta, type ParticipanteConsulta } from '../models/Consulta'
import { DiagnosticoZoonose } from '../models/DiagnosticoZoonose'
import { exameFromRow, exameToRow, type ExameRow } from './storage/exameMapping'
import { Medico } from '../models/Medico'
import { supabase } from './storage/supabaseClient'
import { PetService } from './PetService'
import { validarObrigatorio, validarDataFutura, validarIdUnico } from './validation/validadores'
import { dateInput, rangeEndIso, rangeStartIso, type DateRange } from '../features/common/period'

const petService = new PetService()

export type ResumoConsulta = { id: number; petId: number; date: string; veterinarian: string }

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

function agruparPorConsulta<T extends { consulta_id: number }>(rows: T[]): Map<number, T[]> {
  const mapa = new Map<number, T[]>()
  for (const row of rows) {
    const lista = mapa.get(row.consulta_id) ?? []
    lista.push(row)
    mapa.set(row.consulta_id, lista)
  }
  return mapa
}

async function carregarConsultas(rows: ConsultaRow[]): Promise<Consulta[]> {
  if (rows.length === 0) return []
  const ids = rows.map((r) => r.id)

  const [pets, examesResult, participantesResult] = await Promise.all([
    petService.listarPorIds([...new Set(rows.map((r) => r.pet_id))]),
    supabase.from('exames').select('*').in('consulta_id', ids),
    supabase.from('consulta_participantes').select('consulta_id, profile_id, papel, nome').in('consulta_id', ids),
  ])
  if (examesResult.error) throw new Error(examesResult.error.message)

  const petsPorId = new Map(pets.map((p) => [p.id, p]))
  const examesPorConsulta = agruparPorConsulta((examesResult.data ?? []) as (ExameRow & { consulta_id: number })[])
  const participantesPorConsulta = agruparPorConsulta(
    (participantesResult.data ?? []) as (ParticipanteRow & { consulta_id: number })[],
  )

  const consultas: Consulta[] = []
  for (const row of rows) {
    const pet = petsPorId.get(row.pet_id)
    if (!pet) continue

    const m = row.medicos
    const responsavel = new Medico(m.id, m.nome, m.telefone, m.email, m.especialidade, m.crmv)
    const exames = (examesPorConsulta.get(row.id) ?? []).map(exameFromRow)
    const participantes = participantesPorConsulta.get(row.id) ?? []

    const diagnosticoZoonose = new DiagnosticoZoonose(
      row.diagnostico_zoonose_status,
      row.diagnostico_zoonose_observacoes,
      new Date(row.diagnostico_zoonose_data_confirmacao),
    )

    const exameFisico: ExameFisico = {
      temperatura: row.temperatura ?? undefined,
      frequenciaCardiaca: row.frequencia_cardiaca ?? undefined,
      frequenciaRespiratoria: row.frequencia_respiratoria ?? undefined,
      tpc: row.tpc ?? undefined,
      mucosas: row.mucosas ?? undefined,
      hidratacao: row.hidratacao ?? undefined,
      nivelConsciencia: row.nivel_consciencia ?? undefined,
      pelePelagem: row.pele_pelagem ?? undefined,
      olhos: row.olhos ?? undefined,
      ouvidos: row.ouvidos ?? undefined,
      bocaDentes: row.boca_dentes ?? undefined,
      sistemaRespiratorio: row.sistema_respiratorio ?? undefined,
      sistemaCardiovascular: row.sistema_cardiovascular ?? undefined,
      sistemaGastrointestinal: row.sistema_gastrointestinal ?? undefined,
      sistemaUrinario: row.sistema_urinario ?? undefined,
      sistemaReprodutivo: row.sistema_reprodutivo ?? undefined,
      sistemaNeurologico: row.sistema_neurologico ?? undefined,
      dor: row.dor ?? undefined,
    }
    const alta: Alta = {
      data: row.alta_data ?? undefined,
      condicao: row.alta_condicao ?? undefined,
      orientacoes: row.alta_orientacoes ?? undefined,
      prognostico: row.alta_prognostico ?? undefined,
    }

    const consulta = new Consulta(
      row.id,
      new Date(row.data_consulta),
      row.horario,
      row.diagnostico,
      row.observacoes,
      responsavel,
      pet,
      diagnosticoZoonose,
      exames,
      exameFisico,
      alta,
    )
    consulta.conduta = row.conduta ?? ''
    consulta.participantes = participantes.map((p) => ({ nome: p.nome, papel: p.papel }))
    consulta.supervisorNome = participantes.find((p) => p.profile_id === row.supervisor_id)?.nome ?? ''
    consulta.liberacaoId = row.liberacao_id ?? null
    consulta.versao = row.versao ?? 1
    consulta.retificadoEm = row.retificado_em ? new Date(row.retificado_em) : null
    consulta.retificadoPorNome = row.retificado_por_nome ?? ''
    consultas.push(consulta)
  }
  return consultas
}

export class ConsultaService {
  async listarResumo(range: DateRange | null = null): Promise<ResumoConsulta[]> {
    let query = supabase
      .from('consultas')
      .select('id, pet_id, data_consulta, responsavel_id, medicos!responsavel_id(*)')
    if (range) query = query.gte('data_consulta', rangeStartIso(range)).lte('data_consulta', rangeEndIso(range))
    const { data, error } = await query
    if (error) throw new Error(error.message)
    return (
      (data ?? []) as unknown as { id: number; pet_id: number; data_consulta: string; medicos: MedicoRow | null }[]
    ).map((r) => ({
      id: r.id,
      petId: r.pet_id,
      date: dateInput(new Date(r.data_consulta)),
      veterinarian: r.medicos?.nome ?? '',
    }))
  }

  async proximoId(): Promise<number> {
    const { data, error } = await supabase.from('consultas').select('id').order('id', { ascending: false }).limit(1)
    if (error) throw new Error(error.message)
    const ultimo = ((data ?? []) as { id: number }[])[0]
    return ultimo ? ultimo.id + 1 : 1
  }

  async adicionarConsulta(consulta: Consulta): Promise<void> {
    const { data: existente, error: idError } = await supabase.from('consultas').select('id').eq('id', consulta.id)
    if (idError) throw new Error(idError.message)
    validarIdUnico(consulta.id, (existente ?? []) as { id: number }[], 'consulta')
    validarDataFutura(consulta.dataConsulta, 'dataConsulta')
    validarObrigatorio(consulta.horario, 'horario')

    const consultaRow = {
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
      alta_data: consulta.alta.data ?? null,
      alta_condicao: consulta.alta.condicao ?? null,
      alta_orientacoes: consulta.alta.orientacoes ?? null,
      alta_prognostico: consulta.alta.prognostico ?? null,
    }
    const { error } = consulta.exames.length
      ? await supabase.rpc('salvar_consulta_com_exames', {
          p_consulta: consultaRow,
          p_exames: consulta.exames.map(exameToRow),
        })
      : await supabase.from('consultas').insert(consultaRow)
    if (error) {
      if (error.message.includes('óbito'))
        throw new Error('Este animal tem óbito registrado; não é possível registrar novos atendimentos para ele.')
      if (error.message.includes('liberação'))
        throw new Error(
          'A liberação do professor não é mais válida. Peça uma nova liberação para salvar o atendimento. Os dados foram mantidos.',
        )
      if (consulta.exames.length)
        throw new Error(
          'Não foi possível confirmar a gravação da consulta com exames. Confira a conexão e a migração de exames complementares. Os dados foram mantidos.',
        )
      throw new Error(error.message)
    }

    consulta.pet.adicionarConsulta(consulta)
  }

  async buscarPorId(id: number): Promise<Consulta | undefined> {
    const { data, error } = await supabase
      .from('consultas')
      .select('*, medicos!responsavel_id(*)')
      .eq('id', id)
      .single()
    if (error || !data) return undefined
    return (await carregarConsultas([data as ConsultaRow]))[0]
  }

  async listarPorPet(petId: number): Promise<Consulta[]> {
    const { data, error } = await supabase.from('consultas').select('*, medicos!responsavel_id(*)').eq('pet_id', petId)
    if (error) throw new Error(error.message)
    return carregarConsultas((data ?? []) as ConsultaRow[])
  }
}
