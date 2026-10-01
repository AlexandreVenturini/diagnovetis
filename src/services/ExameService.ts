import { Exame } from '../models/Exame'
import { supabase } from './storage/supabaseClient'
import { linhaParaExame, type ExameRow } from './storage/mapeamentoExame'
import { rascunhoParaExame, type RascunhoExame } from '../features/atendimentos/exameTipos'

export class ExameService {
  criarSolicitacoes(rascunhos: RascunhoExame[]): Exame[] {
    return rascunhos.map(rascunhoParaExame)
  }

  async listarPorConsulta(consultaId: number): Promise<Exame[]> {
    const { data: dados, error: erro } = await supabase.from('exames').select('*').eq('consulta_id', consultaId)
    if (erro) throw new Error(erro.message)
    return (dados ?? []).map((linha) => linhaParaExame(linha as ExameRow))
  }
  async buscarPorId(id: number): Promise<Exame | undefined> {
    const { data: dados, error: erro } = await supabase.from('exames').select('*').eq('id', id).maybeSingle()
    if (erro) throw new Error(erro.message)
    return dados ? linhaParaExame(dados as ExameRow) : undefined
  }
  async listarPorPet(petId: number): Promise<Exame[]> {
    const { data: dados, error: erro } = await supabase.from('consultas').select('id').eq('pet_id', petId)
    if (erro) throw new Error(erro.message)
    return (await Promise.all((dados ?? []).map((linha) => this.listarPorConsulta(linha.id)))).flat()
  }
  async atualizarResultado(exame: Exame, rascunho: RascunhoExame): Promise<Exame> {
    const atualizado = rascunhoParaExame({
      ...rascunho,
      nome: exame.nomeExame,
      categoria: exame.categoria,
      dataSolicitacao: `${exame.dataSolicitacao.getFullYear()}-${String(exame.dataSolicitacao.getMonth() + 1).padStart(2, '0')}-${String(exame.dataSolicitacao.getDate()).padStart(2, '0')}`,
    })
    const { data: dados, error: erro } = await supabase
      .from('exames')
      .update({
        data_realizacao: rascunho.dataRealizacao || null,
        status: atualizado.status,
        laudo: atualizado.laudo,
        laudo_anexo: atualizado.laudoAnexo,
        resultado: atualizado.resultado,
        interpretacao_clinica: atualizado.interpretacao,
      })
      .eq('id', exame.id)
      .eq('consulta_id', exame.consultaId)
      .select('*')
      .single()
    if (erro || !dados)
      throw new Error(
        'Não foi possível salvar o resultado. Confira a conexão e a atualização do banco. Os campos foram mantidos.',
      )
    return linhaParaExame(dados as ExameRow)
  }
}
