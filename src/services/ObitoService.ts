import type { ObitoDados } from '../features/supervisao/supervisaoTipos'
import type { RegistroObito, VersaoObito } from '../features/prontuarios/obito/obitoTipos'
import { compararObito } from '../features/prontuarios/obito/obitoRegras'
import { supabase } from './storage/supabaseClient'

type ObitoRow = {
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

function linhaParaObito(linha: ObitoRow): RegistroObito {
  return {
    id: linha.id,
    petId: linha.pet_id,
    consultaId: linha.consulta_id,
    dataHora: linha.data_hora,
    circunstancias: linha.circunstancias,
    causaProvavel: linha.causa_provavel,
    houveReanimacao: linha.houve_reanimacao,
    eutanasia: linha.eutanasia,
    medicoResponsavelId: linha.medico_responsavel_id,
    medicoResponsavelNome: linha.medico_responsavel_nome,
    comunicadoResponsavel: linha.comunicado_responsavel,
    comunicacaoDetalhes: linha.comunicacao_detalhes,
    necropsia: linha.necropsia,
    destinoCorpo: linha.destino_corpo,
    registradoPorNome: linha.registrado_por_nome,
    aprovadoPorNome: linha.aprovado_por_nome,
    registradoEm: linha.registrado_em,
    versao: linha.versao,
    retificadoEm: linha.retificado_em,
    retificadoPorNome: linha.retificado_por_nome ?? '',
  }
}

type VersaoRow = {
  versao: number
  dados: Record<string, unknown>
  motivo: string
  alterado_por_nome: string
  alterado_em: string
}

export class ObitoService {
  async buscar(petId: number): Promise<RegistroObito | null> {
    const { data: dados, error: erro } = await supabase
      .from('obitos')
      .select('*')
      .eq('pet_id', petId)
      .maybeSingle<ObitoRow>()
    if (erro) throw new Error('Não foi possível carregar o registro de óbito.')
    return dados ? linhaParaObito(dados) : null
  }

  async registrar(petId: number, dados: ObitoDados): Promise<number> {
    const { data, error: erro } = await supabase.rpc('registrar_obito', { p_pet: petId, p_dados: dados })
    if (erro) throw new Error(erro.message)
    return data as number
  }

  async retificar(obitoId: number, dados: ObitoDados, motivo: string): Promise<number> {
    const { data, error: erro } = await supabase.rpc('retificar_obito', {
      p_obito: obitoId,
      p_dados: dados,
      p_motivo: motivo,
    })
    if (erro) throw new Error(erro.message)
    return data as number
  }

  async listarVersoes(obitoId: number): Promise<VersaoObito[]> {
    const [versoes, atual] = await Promise.all([
      supabase
        .from('obito_versoes')
        .select('versao, dados, motivo, alterado_por_nome, alterado_em')
        .eq('obito_id', obitoId)
        .order('versao'),
      supabase.from('obitos').select('*').eq('id', obitoId).single(),
    ])
    if (versoes.error || atual.error) throw new Error('Não foi possível carregar o histórico do registro de óbito.')
    const linhas = (versoes.data ?? []) as VersaoRow[]
    return linhas
      .map((linha, indice) => ({
        versao: linha.versao,
        motivo: linha.motivo,
        alteradoPorNome: linha.alterado_por_nome,
        alteradoEm: linha.alterado_em,
        alteracoes: compararObito(linha.dados, linhas[indice + 1]?.dados ?? (atual.data as Record<string, unknown>)),
      }))
      .reverse()
  }
}
