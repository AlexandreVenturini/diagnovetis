import type { CamposConsulta, VersaoConsulta } from '../features/records/retification/retification'
import { supabase } from './storage/supabaseClient'

type VersaoRow = {
  versao: number
  dados: CamposConsulta
  motivo: string
  alterado_por_nome: string
  aprovado_por_nome: string
  alterado_em: string
}

export class RetificationService {
  async retificar(
    consultaId: number,
    campos: CamposConsulta,
    motivo: string,
    liberacaoId: string | null,
  ): Promise<number> {
    const { data, error } = await supabase.rpc('retificar_consulta', {
      p_consulta: consultaId,
      p_campos: campos,
      p_motivo: motivo,
      p_liberacao: liberacaoId,
    })
    if (error) {
      if (error.message.includes('Nenhuma alteração')) throw new Error('Nenhum campo foi alterado.')
      if (error.message.includes('liberação'))
        throw new Error('A liberação do professor não é mais válida. Peça uma nova liberação.')
      if (error.message.includes('motivo')) throw new Error('Informe o motivo da retificação.')
      throw new Error('Não foi possível salvar a retificação. Os dados preenchidos foram mantidos.')
    }
    return data as number
  }

  async listarVersoes(consultaId: number): Promise<{ versoes: VersaoConsulta[]; atual: CamposConsulta }> {
    const [versoesResult, atualResult] = await Promise.all([
      supabase
        .from('consulta_versoes')
        .select('versao, dados, motivo, alterado_por_nome, aprovado_por_nome, alterado_em')
        .eq('consulta_id', consultaId)
        .order('versao'),
      supabase.from('consultas').select('*').eq('id', consultaId).single(),
    ])
    if (versoesResult.error || atualResult.error) throw new Error('Não foi possível carregar o histórico de versões.')
    const versoes = ((versoesResult.data ?? []) as VersaoRow[]).map((row) => ({
      versao: row.versao,
      dados: row.dados,
      motivo: row.motivo,
      alteradoPorNome: row.alterado_por_nome,
      aprovadoPorNome: row.aprovado_por_nome,
      alteradoEm: row.alterado_em,
    }))
    return { versoes, atual: atualResult.data as CamposConsulta }
  }
}
