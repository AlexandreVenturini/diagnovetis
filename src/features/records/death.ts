import { supabase } from '../../services/storage/supabaseClient'
import type { ObitoDados } from '../consultations/supervision'

export type DeathRecord = {
  id: number
  petId: number
  consultaId: number | null
  dataHora: string
  circunstancias: string
  causaProvavel: string
  houveReanimacao: boolean
  eutanasia: boolean
  medicoResponsavelId: number | null
  medicoResponsavelNome: string
  comunicadoResponsavel: boolean
  comunicacaoDetalhes: string
  necropsia: boolean
  destinoCorpo: string
  registradoPorNome: string
  aprovadoPorNome: string
  registradoEm: string
  versao: number
  retificadoEm: string | null
  retificadoPorNome: string
}

type DeathRow = {
  id: number; pet_id: number; consulta_id: number | null; data_hora: string; circunstancias: string; causa_provavel: string
  houve_reanimacao: boolean; eutanasia: boolean; medico_responsavel_id: number | null; medico_responsavel_nome: string
  comunicado_responsavel: boolean; comunicacao_detalhes: string; necropsia: boolean; destino_corpo: string
  registrado_por_nome: string; aprovado_por_nome: string; registrado_em: string; versao: number
  retificado_em: string | null; retificado_por_nome: string | null
}

export type DeathVersion = { versao: number; motivo: string; alteradoPorNome: string; alteradoEm: string; alteracoes: { rotulo: string; antes: string; depois: string }[] }

export const DESTINOS_CORPO = ['Cremação', 'Sepultamento', 'Encaminhado para necropsia', 'Encaminhado para ensino/pesquisa', 'Devolvido ao responsável', 'Recolhimento por empresa especializada']

const CAMPOS: Record<string, string> = {
  data_hora: 'Data e hora',
  circunstancias: 'Circunstâncias',
  causa_provavel: 'Causa provável',
  houve_reanimacao: 'Houve reanimação',
  eutanasia: 'Eutanásia',
  medico_responsavel_nome: 'Profissional responsável',
  comunicado_responsavel: 'Responsável comunicado',
  comunicacao_detalhes: 'Detalhes da comunicação',
  necropsia: 'Necropsia',
  destino_corpo: 'Destinação do corpo',
}

function rowToDeath(row: DeathRow): DeathRecord {
  return {
    id: row.id, petId: row.pet_id, consultaId: row.consulta_id, dataHora: row.data_hora, circunstancias: row.circunstancias,
    causaProvavel: row.causa_provavel, houveReanimacao: row.houve_reanimacao, eutanasia: row.eutanasia,
    medicoResponsavelId: row.medico_responsavel_id, medicoResponsavelNome: row.medico_responsavel_nome,
    comunicadoResponsavel: row.comunicado_responsavel, comunicacaoDetalhes: row.comunicacao_detalhes, necropsia: row.necropsia,
    destinoCorpo: row.destino_corpo, registradoPorNome: row.registrado_por_nome, aprovadoPorNome: row.aprovado_por_nome,
    registradoEm: row.registrado_em, versao: row.versao, retificadoEm: row.retificado_em, retificadoPorNome: row.retificado_por_nome ?? '',
  }
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function formatValue(campo: string, value: unknown) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não'
  if (campo === 'data_hora') return formatDateTime(String(value))
  return String(value)
}

export function deathToDados(death: DeathRecord): ObitoDados {
  return {
    data_hora: death.dataHora, circunstancias: death.circunstancias, causa_provavel: death.causaProvavel,
    houve_reanimacao: death.houveReanimacao, eutanasia: death.eutanasia, medico_responsavel_id: death.medicoResponsavelId ?? 0,
    comunicado_responsavel: death.comunicadoResponsavel, comunicacao_detalhes: death.comunicacaoDetalhes,
    necropsia: death.necropsia, destino_corpo: death.destinoCorpo, consulta_id: death.consultaId,
  }
}

export function compararObito(antes: Record<string, unknown>, depois: Record<string, unknown>) {
  return Object.entries(CAMPOS)
    .filter(([campo]) => formatValue(campo, antes[campo]) !== formatValue(campo, depois[campo]))
    .map(([campo, rotulo]) => ({ rotulo, antes: formatValue(campo, antes[campo]), depois: formatValue(campo, depois[campo]) }))
}

export async function buscarObito(petId: number): Promise<DeathRecord | null> {
  const { data, error } = await supabase.from('obitos').select('*').eq('pet_id', petId).maybeSingle<DeathRow>()
  if (error) throw new Error('Não foi possível carregar o registro de óbito.')
  return data ? rowToDeath(data) : null
}

export async function registrarObito(petId: number, dados: ObitoDados): Promise<number> {
  const { data, error } = await supabase.rpc('registrar_obito', { p_pet: petId, p_dados: dados })
  if (error) throw new Error(error.message)
  return data as number
}

export async function retificarObito(obitoId: number, dados: ObitoDados, motivo: string): Promise<number> {
  const { data, error } = await supabase.rpc('retificar_obito', { p_obito: obitoId, p_dados: dados, p_motivo: motivo })
  if (error) throw new Error(error.message)
  return data as number
}

export async function listarVersoesObito(obitoId: number): Promise<DeathVersion[]> {
  const [versoes, atual] = await Promise.all([
    supabase.from('obito_versoes').select('versao, dados, motivo, alterado_por_nome, alterado_em').eq('obito_id', obitoId).order('versao'),
    supabase.from('obitos').select('*').eq('id', obitoId).single(),
  ])
  if (versoes.error || atual.error) throw new Error('Não foi possível carregar o histórico do registro de óbito.')
  const rows = (versoes.data ?? []) as { versao: number; dados: Record<string, unknown>; motivo: string; alterado_por_nome: string; alterado_em: string }[]
  return rows.map((row, index) => ({
    versao: row.versao,
    motivo: row.motivo,
    alteradoPorNome: row.alterado_por_nome,
    alteradoEm: row.alterado_em,
    alteracoes: compararObito(row.dados, rows[index + 1]?.dados ?? (atual.data as Record<string, unknown>)),
  })).reverse()
}
