import type { LembreteAgendamento } from '../../features/agenda/agendaTipos'
import type { DadosAtendimento } from '../../features/atendimentos/atendimentoTipos'
import type { ItemReceita, Receita } from '../../features/receitas/receita'
import type { DadosClinicos } from '../../features/condicoes/condicaoTipos'
import type { PrescricaoSalva } from '../../models/Prescricao'

export type Json = Record<string, unknown>
type Mapa<T> = Record<keyof T & string, string>

const CAMPOS_ATENDIMENTO: Mapa<DadosAtendimento> = {
  nomePet: 'dogName',
  idade: 'age',
  raca: 'breed',
  nomeTutor: 'tutorName',
  veterinario: 'veterinarian',
  veterinarioId: 'veterinarianId',
  idPaciente: 'patientId',
  peso: 'weight',
  queixaPrincipal: 'mainComplaint',
  historico: 'history',
  mucosas: 'mucosa',
  tpc: 'capillaryRefill',
  frequenciaCardiaca: 'heartRate',
  frequenciaRespiratoria: 'respiratoryRate',
  temperatura: 'temperature',
  hidratacao: 'hydration',
  nivelConsciencia: 'consciousness',
  pelePelagem: 'skinAndCoat',
  olhos: 'eyes',
  ouvidos: 'ears',
  bocaDentes: 'mouthAndTeeth',
  sistemaRespiratorio: 'respiratorySystem',
  sistemaCardiovascular: 'cardiovascularSystem',
  sistemaGastrointestinal: 'gastrointestinalSystem',
  sistemaUrinario: 'urinarySystem',
  sistemaReprodutivo: 'reproductiveSystem',
  sistemaNeurologico: 'neurologicalSystem',
  dor: 'pain',
  diagnostico: 'diagnosis',
  suspeitaZoonose: 'zoonosisSearch',
  conduta: 'conduct',
  dataAlta: 'dischargeDate',
  condicaoAlta: 'dischargeCondition',
  orientacoesAlta: 'dischargeInstructions',
  prognosticoAlta: 'dischargePrognosis',
}

const CAMPOS_ITEM_RECEITA: Mapa<ItemReceita> = {
  medicamento: 'medication',
  dose: 'dose',
  via: 'route',
  frequencia: 'frequency',
  duracao: 'duration',
  quantidade: 'quantity',
}

const CAMPOS_LEMBRETE: Mapa<LembreteAgendamento> = { id: 'id', tipo: 'type', data: 'date', concluido: 'done' }

const CAMPOS_CLINICOS: Mapa<DadosClinicos> = {
  categoria: 'category',
  tipoCondicao: 'conditionType',
  sistemas: 'systems',
  etiologia: 'etiology',
  faixasEtarias: 'ageGroups',
  ehZoonose: 'isZoonosis',
  transmissao: 'transmission',
  examesSugeridos: 'diagnostics',
  diferenciais: 'differentials',
  protocolos: 'protocols',
  alerta: 'alert',
  hospedeiros: 'hosts',
  prevalencia: 'prevalence',
}

function paraJson<T extends object>(valor: T, mapa: Mapa<T>): Json {
  const origem = valor as Json
  return Object.fromEntries(
    Object.entries(mapa)
      .filter(([campo]) => origem[campo] !== undefined)
      .map(([campo, chave]) => [chave, origem[campo]]),
  )
}

function deJson<T>(json: unknown, mapa: Mapa<T>): T {
  const origem = (json ?? {}) as Json
  return Object.fromEntries(
    Object.entries<string>(mapa)
      .map(([campo, chave]) => [campo, chave in origem ? origem[chave] : origem[campo]])
      .filter(([, valor]) => valor !== undefined),
  ) as T
}

export function receitaSalvaParaJson(salva: PrescricaoSalva): Json {
  return {
    version: salva.versao,
    issuedAt: salva.emitidaEm,
    patient: paraJson(salva.paciente, CAMPOS_ATENDIMENTO),
    prescription: {
      crmv: salva.receita.crmv,
      instructions: salva.receita.orientacoes,
      items: salva.receita.itens.map((item) => paraJson(item, CAMPOS_ITEM_RECEITA)),
    },
  }
}

export function receitaSalvaDeJson(json: unknown): PrescricaoSalva {
  const origem = (json ?? {}) as Json
  const receita = (origem.prescription ?? origem.receita ?? {}) as Json
  const itens = (receita.items ?? receita.itens ?? []) as unknown[]
  return {
    versao: 1,
    emitidaEm: String(origem.issuedAt ?? origem.emitidaEm ?? ''),
    paciente: deJson<DadosAtendimento>(origem.patient ?? origem.paciente, CAMPOS_ATENDIMENTO),
    receita: {
      crmv: String(receita.crmv ?? ''),
      orientacoes: String(receita.instructions ?? receita.orientacoes ?? ''),
      itens: itens.map((item) => deJson<ItemReceita>(item, CAMPOS_ITEM_RECEITA)),
    } satisfies Receita,
  }
}

export const lembretesParaJson = (lembretes: LembreteAgendamento[]) =>
  lembretes.map((lembrete) => paraJson(lembrete, CAMPOS_LEMBRETE))

export const lembretesDeJson = (json: unknown): LembreteAgendamento[] =>
  ((json ?? []) as unknown[]).map((item) => deJson<LembreteAgendamento>(item, CAMPOS_LEMBRETE))

export const dadosClinicosParaJson = (dados: DadosClinicos) => paraJson(dados, CAMPOS_CLINICOS)

export const dadosClinicosDeJson = (json: unknown): DadosClinicos | null =>
  json ? deJson<DadosClinicos>(json, CAMPOS_CLINICOS) : null
