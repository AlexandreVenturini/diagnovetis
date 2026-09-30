import type { ObitoDados } from '../features/supervision/supervisionTypes'
import type { DeathRecord, DeathVersion } from '../features/records/death/deathTypes'
import { compararObito } from '../features/records/death/deathRules'
import { supabase } from './storage/supabaseClient'

type DeathRow = {
  id: number
  pet_id: number
  consulta_id: number | null
  data_hora: string
  circunstancias: string
  causa_provavel: string
  houve_reanimacao: boolean
  eutanasia: boolean
  medico_responsavel_id: number | null
  medico_responsavel_nome: string
  comunicado_responsavel: boolean
  comunicacao_detalhes: string
  necropsia: boolean
  destino_corpo: string
  registrado_por_nome: string
  aprovado_por_nome: string
  registrado_em: string
  versao: number
  retificado_em: string | null
  retificado_por_nome: string | null
}

function rowToDeath(row: DeathRow): DeathRecord {
  return {
    id: row.id,
    petId: row.pet_id,
    consultaId: row.consulta_id,
    dataHora: row.data_hora,
    circunstancias: row.circunstancias,
    causaProvavel: row.causa_provavel,
    houveReanimacao: row.houve_reanimacao,
    eutanasia: row.eutanasia,
    medicoResponsavelId: row.medico_responsavel_id,
    medicoResponsavelNome: row.medico_responsavel_nome,
    comunicadoResponsavel: row.comunicado_responsavel,
    comunicacaoDetalhes: row.comunicacao_detalhes,
    necropsia: row.necropsia,
    destinoCorpo: row.destino_corpo,
    registradoPorNome: row.registrado_por_nome,
    aprovadoPorNome: row.aprovado_por_nome,
    registradoEm: row.registrado_em,
    versao: row.versao,
    retificadoEm: row.retificado_em,
    retificadoPorNome: row.retificado_por_nome ?? '',
  }
}

type VersaoRow = {
  versao: number
  dados: Record<string, unknown>
  motivo: string
  alterado_por_nome: string
  alterado_em: string
}

export class DeathService {
  async buscar(petId: number): Promise<DeathRecord | null> {
    const { data, error } = await supabase.from('obitos').select('*').eq('pet_id', petId).maybeSingle<DeathRow>()
    if (error) throw new Error('Não foi possível carregar o registro de óbito.')
    return data ? rowToDeath(data) : null
  }

  async registrar(petId: number, dados: ObitoDados): Promise<number> {
    const { data, error } = await supabase.rpc('registrar_obito', { p_pet: petId, p_dados: dados })
    if (error) throw new Error(error.message)
    return data as number
  }

  async retificar(obitoId: number, dados: ObitoDados, motivo: string): Promise<number> {
    const { data, error } = await supabase.rpc('retificar_obito', {
      p_obito: obitoId,
      p_dados: dados,
      p_motivo: motivo,
    })
    if (error) throw new Error(error.message)
    return data as number
  }

  async listarVersoes(obitoId: number): Promise<DeathVersion[]> {
    const [versoes, atual] = await Promise.all([
      supabase
        .from('obito_versoes')
        .select('versao, dados, motivo, alterado_por_nome, alterado_em')
        .eq('obito_id', obitoId)
        .order('versao'),
      supabase.from('obitos').select('*').eq('id', obitoId).single(),
    ])
    if (versoes.error || atual.error) throw new Error('Não foi possível carregar o histórico do registro de óbito.')
    const rows = (versoes.data ?? []) as VersaoRow[]
    return rows
      .map((row, index) => ({
        versao: row.versao,
        motivo: row.motivo,
        alteradoPorNome: row.alterado_por_nome,
        alteradoEm: row.alterado_em,
        alteracoes: compararObito(row.dados, rows[index + 1]?.dados ?? (atual.data as Record<string, unknown>)),
      }))
      .reverse()
  }
}
