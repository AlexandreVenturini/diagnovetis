import type { CamposConsulta, VersaoConsulta } from '../features/prontuarios/retificacao/retificacaoRegras'
import { supabase } from './storage/supabaseClient'

type VersaoRow = {
  versao: number
  dados: CamposConsulta
  motivo: string
  alterado_por_nome: string
  aprovado_por_nome: string
  alterado_em: string
}

export class RetificacaoService {
  async retificar(
    consultaId: number,
    campos: CamposConsulta,
    motivo: string,
    liberacaoId: string | null,
  ): Promise<number> {
    const { data: dados, error: erro } = await supabase.rpc('retificar_consulta', {
      p_consulta: consultaId,
      p_campos: campos,
      p_motivo: motivo,
      p_liberacao: liberacaoId,
    })
    if (erro) {
      if (erro.message.includes('Nenhuma alteração')) throw new Error('Nenhum campo foi alterado.')
      if (erro.message.includes('liberação'))
        throw new Error('A liberação do professor não é mais válida. Peça uma nova liberação.')
      if (erro.message.includes('motivo')) throw new Error('Informe o motivo da retificação.')
      throw new Error('Não foi possível salvar a retificação. Os dados preenchidos foram mantidos.')
    }
    return dados as number
  }

  async listarVersoes(consultaId: number): Promise<{ versoes: VersaoConsulta[]; atual: CamposConsulta }> {
    const [resultadoVersoes, resultadoAtual] = await Promise.all([
      supabase
        .from('consulta_versoes')
        .select('versao, dados, motivo, alterado_por_nome, aprovado_por_nome, alterado_em')
        .eq('consulta_id', consultaId)
        .order('versao'),
      supabase.from('consultas').select('*').eq('id', consultaId).single(),
    ])
    if (resultadoVersoes.error || resultadoAtual.error)
      throw new Error('Não foi possível carregar o histórico de versões.')
    const versoes = ((resultadoVersoes.data ?? []) as VersaoRow[]).map((linha) => ({
      versao: linha.versao,
      dados: linha.dados,
      motivo: linha.motivo,
      alteradoPorNome: linha.alterado_por_nome,
      aprovadoPorNome: linha.aprovado_por_nome,
      alteradoEm: linha.alterado_em,
    }))
    return { versoes, atual: resultadoAtual.data as CamposConsulta }
  }
}
