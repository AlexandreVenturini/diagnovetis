import type { Agendamento, DadosFormularioAgendamento } from '../features/agenda/agendaTipos'
import type { Intervalo } from '../features/shared/periodo'
import { lembretesDeJson, lembretesParaJson, type Json } from './storage/conversaoJson'
import { supabase } from './storage/supabaseClient'

type AgendamentoRow = {
  id: number
  dog_id?: number | null
  dog_name: string
  dog_age?: string | null
  dog_breed?: string | null
  kind: string
  tutor_name: string
  date: string
  time: string
  service_type: string
  veterinarian: string
  notes: string
  status: string
  cancellation_reason: string
  reminders: Json[] | null
}

const ERRO_CARREGAMENTO = 'Não foi possível carregar a agenda.'

function linhaParaAgendamento(linha: AgendamentoRow): Agendamento {
  return {
    id: linha.id,
    petId: linha.dog_id ?? undefined,
    nomePet: linha.dog_name,
    idadePet: linha.dog_age ?? undefined,
    racaPet: linha.dog_breed ?? undefined,
    tipo: linha.kind as Agendamento['tipo'],
    nomeTutor: linha.tutor_name,
    data: linha.date,
    horario: linha.time,
    tipoServico: linha.service_type,
    veterinario: linha.veterinarian,
    observacoes: linha.notes,
    status: linha.status as Agendamento['status'],
    motivoCancelamento: linha.cancellation_reason ?? '',
    lembretes: lembretesDeJson(linha.reminders),
  }
}

function alteracoesParaRow(alteracoes: Partial<Agendamento>): Partial<AgendamentoRow> {
  const linha: Partial<AgendamentoRow> = {}
  if (alteracoes.status !== undefined) linha.status = alteracoes.status
  if (alteracoes.motivoCancelamento !== undefined) linha.cancellation_reason = alteracoes.motivoCancelamento
  if (alteracoes.lembretes !== undefined) linha.reminders = lembretesParaJson(alteracoes.lembretes)
  if (alteracoes.veterinario !== undefined) linha.veterinarian = alteracoes.veterinario
  if (alteracoes.data !== undefined) linha.date = alteracoes.data
  if (alteracoes.horario !== undefined) linha.time = alteracoes.horario
  if (alteracoes.observacoes !== undefined) linha.notes = alteracoes.observacoes
  return linha
}

const paraAgendamentos = (linhas: unknown[] | null) =>
  (linhas ?? []).map((linha) => linhaParaAgendamento(linha as AgendamentoRow))

export class AgendamentoService {
  async listar(intervalo: Intervalo | null): Promise<Agendamento[]> {
    if (!intervalo) {
      const { data: dados, error: erro } = await supabase.from('agendamentos').select('*').order('date').order('time')
      if (erro) throw new Error(ERRO_CARREGAMENTO)
      return paraAgendamentos(dados)
    }
    const [noPeriodo, semData, dataNula] = await Promise.all([
      supabase
        .from('agendamentos')
        .select('*')
        .gte('date', intervalo.inicio)
        .lte('date', intervalo.fim)
        .order('date')
        .order('time'),
      supabase.from('agendamentos').select('*').eq('date', ''),
      supabase.from('agendamentos').select('*').is('date', null),
    ])
    if (noPeriodo.error) throw new Error(ERRO_CARREGAMENTO)
    return paraAgendamentos([...(noPeriodo.data ?? []), ...(semData.data ?? []), ...(dataNula.data ?? [])])
  }

  async listarComLembretes(): Promise<Agendamento[]> {
    const { data: dados } = await supabase.from('agendamentos').select('*').neq('reminders', '[]')
    return paraAgendamentos(dados).filter((item) => item.lembretes.length > 0)
  }

  async temConflito(veterinario: string, data: string, horario: string, idIgnorado?: number): Promise<boolean> {
    const { data: dados } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('veterinarian', veterinario)
      .eq('date', data)
      .eq('time', horario)
    return paraAgendamentos(dados).some((item) => item.id !== idIgnorado && item.status !== 'cancelled')
  }

  async criar(dados: DadosFormularioAgendamento): Promise<Agendamento | null> {
    const linha: AgendamentoRow = {
      id: Date.now(),
      dog_id: dados.petId ?? null,
      dog_name: dados.nomePet,
      dog_age: dados.idadePet ?? null,
      dog_breed: dados.racaPet ?? null,
      kind: dados.tipo,
      tutor_name: dados.nomeTutor,
      date: dados.data,
      time: dados.horario,
      service_type: dados.tipoServico,
      veterinarian: dados.veterinario,
      notes: dados.observacoes,
      status: 'confirmed',
      cancellation_reason: '',
      reminders: [],
    }
    const { error: erro } = await supabase.from('agendamentos').insert(linha)
    return erro ? null : linhaParaAgendamento(linha)
  }

  async atualizar(id: number, alteracoes: Partial<Agendamento>): Promise<boolean> {
    const { error: erro } = await supabase.from('agendamentos').update(alteracoesParaRow(alteracoes)).eq('id', id)
    return !erro
  }
}
