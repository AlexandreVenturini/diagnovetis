import type {
  AlvoLiberacao,
  LiberacaoStatus,
  ObitoDados,
  PedidoLiberacao,
  SituacaoLiberacao,
  OpcaoEstudante,
  TipoLiberacao,
  OpcaoVeterinario,
} from '../features/supervisao/supervisaoTipos'
import { receitaSalvaDeJson, receitaSalvaParaJson } from './storage/conversaoJson'
import { supabase } from './storage/supabaseClient'

type VeterinarioRow = { profile_id: string; medico_id: number; nome: string; crmv: string; email: string }
type EstudanteRow = { profile_id: string; nome: string; matricula: string | null }
type SituacaoRow = {
  status: LiberacaoStatus
  motivo_recusa: string | null
  prescricao_id: string | null
  obito_id: number | null
}
type PedidoRow = {
  id: string
  aluno_nome: string
  aluno_matricula: string | null
  participantes: string[] | null
  criada_em: string
  tipo: TipoLiberacao | null
  consulta_alvo: number | null
  paciente: string | null
  receita_dados: unknown
  dados_pedido: ObitoDados | null
}

function alvoParams({ consultaId, receita, obito }: AlvoLiberacao) {
  return {
    p_consulta: consultaId ?? null,
    p_receita_pet: receita?.petId ?? null,
    p_receita_dados: receita ? receitaSalvaParaJson(receita.dados) : null,
    p_tipo: obito ? 'obito' : null,
    p_pet_alvo: obito?.petId ?? null,
    p_dados: obito?.dados ?? null,
  }
}

function linhaParaPedido(linha: PedidoRow): PedidoLiberacao {
  return {
    id: linha.id,
    alunoNome: linha.aluno_nome,
    alunoMatricula: linha.aluno_matricula ?? '',
    participantes: linha.participantes ?? [],
    criadaEm: linha.criada_em,
    tipo: linha.tipo ?? 'atendimento',
    consultaAlvo: linha.consulta_alvo,
    paciente: linha.paciente ?? '',
    receita: linha.receita_dados ? receitaSalvaDeJson(linha.receita_dados) : null,
    obito: linha.dados_pedido,
  }
}

export class SupervisaoService {
  async listarVeterinarios(): Promise<OpcaoVeterinario[]> {
    const { data: dados, error: erro } = await supabase.rpc('veterinarios_disponiveis')
    if (erro) throw new Error(erro.message)
    return ((dados ?? []) as VeterinarioRow[]).map((linha) => ({
      idPerfil: linha.profile_id,
      medicoId: linha.medico_id,
      nome: linha.nome,
      crmv: linha.crmv,
      email: linha.email,
    }))
  }

  async listarEstudantes(): Promise<OpcaoEstudante[]> {
    const { data: dados, error: erro } = await supabase.rpc('estudantes_disponiveis')
    if (erro) throw new Error(erro.message)
    return ((dados ?? []) as EstudanteRow[]).map((linha) => ({
      idPerfil: linha.profile_id,
      nome: linha.nome,
      matricula: linha.matricula ?? '',
    }))
  }

  async liberarComSenha(
    supervisorId: string,
    senha: string,
    participantes: string[],
    alvo: AlvoLiberacao,
  ): Promise<string | null> {
    const { data: dados, error: erro } = await supabase.rpc('liberar_atendimento', {
      p_supervisor: supervisorId,
      p_senha: senha,
      p_participantes: participantes,
      ...alvoParams(alvo),
    })
    if (erro) throw new Error(erro.message)
    return (dados as string | null) ?? null
  }

  async solicitar(supervisorId: string, participantes: string[], alvo: AlvoLiberacao): Promise<string> {
    const { data: dados, error: erro } = await supabase.rpc('solicitar_liberacao', {
      p_supervisor: supervisorId,
      p_participantes: participantes,
      ...alvoParams(alvo),
    })
    if (erro) throw new Error(erro.message)
    return dados as string
  }

  async cancelar(liberacaoId: string): Promise<void> {
    const { error: erro } = await supabase.rpc('cancelar_liberacao', { p_liberacao: liberacaoId })
    if (erro) throw new Error(erro.message)
  }

  async buscarSituacao(liberacaoId: string): Promise<SituacaoLiberacao | null> {
    const { data: dados, error: erro } = await supabase
      .from('liberacoes_atendimento')
      .select('status, motivo_recusa, prescricao_id, obito_id')
      .eq('id', liberacaoId)
      .maybeSingle<SituacaoRow>()
    if (erro) throw new Error(erro.message)
    if (!dados) return null
    return {
      status: dados.status,
      motivoRecusa: dados.motivo_recusa ?? '',
      prescricaoId: dados.prescricao_id,
      obitoId: dados.obito_id,
    }
  }

  async responder(liberacaoId: string, aprovar: boolean, motivo: string | null = null): Promise<void> {
    const { error: erro } = await supabase.rpc('responder_liberacao', {
      p_liberacao: liberacaoId,
      p_aprovar: aprovar,
      p_motivo: motivo,
    })
    if (erro) throw new Error(erro.message)
  }

  async listarPendentes(): Promise<PedidoLiberacao[]> {
    const { data: dados, error: erro } = await supabase.rpc('pedidos_liberacao_pendentes')
    if (erro) throw new Error(erro.message)
    return ((dados ?? []) as PedidoRow[]).map(linhaParaPedido)
  }

  async emitirReceita(liberacaoId: string): Promise<string> {
    const { data: dados, error: erro } = await supabase.rpc('emitir_receita', { p_liberacao: liberacaoId })
    if (erro) throw new Error('Não foi possível emitir a receita aprovada. Tente novamente.')
    return dados as string
  }

  async registrarObito(liberacaoId: string): Promise<number> {
    const { data: dados, error: erro } = await supabase.rpc('registrar_obito_liberado', { p_liberacao: liberacaoId })
    if (erro) throw new Error('Não foi possível concluir o registro de óbito aprovado. Tente novamente.')
    return dados as number
  }

  observar(filtro: string, aoAlterar: () => void): () => void {
    const canal = supabase
      .channel(`liberacoes-${filtro}-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'liberacoes_atendimento', filter: filtro },
        aoAlterar,
      )
      .subscribe()
    const intervalo = window.setInterval(aoAlterar, 10000)
    return () => {
      window.clearInterval(intervalo)
      void supabase.removeChannel(canal)
    }
  }
}
