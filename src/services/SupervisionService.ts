import type { PrescricaoSalva } from '../models/Prescricao'
import type {
  AlvoLiberacao,
  LiberacaoStatus,
  ObitoDados,
  PedidoLiberacao,
  SituacaoLiberacao,
  StudentOption,
  TipoLiberacao,
  VeterinarianOption,
} from '../features/supervision/supervisionTypes'
import { supabase } from './storage/supabaseClient'

type VeterinarianRow = { profile_id: string; medico_id: number; nome: string; crmv: string; email: string }
type StudentRow = { profile_id: string; nome: string; matricula: string | null }
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
  receita_dados: PrescricaoSalva | null
  dados_pedido: ObitoDados | null
}

function alvoParams({ consultaId, receita, obito }: AlvoLiberacao) {
  return {
    p_consulta: consultaId ?? null,
    p_receita_pet: receita?.petId ?? null,
    p_receita_dados: receita?.dados ?? null,
    p_tipo: obito ? 'obito' : null,
    p_pet_alvo: obito?.petId ?? null,
    p_dados: obito?.dados ?? null,
  }
}

function rowToPedido(row: PedidoRow): PedidoLiberacao {
  return {
    id: row.id,
    alunoNome: row.aluno_nome,
    alunoMatricula: row.aluno_matricula ?? '',
    participantes: row.participantes ?? [],
    criadaEm: row.criada_em,
    tipo: row.tipo ?? 'atendimento',
    consultaAlvo: row.consulta_alvo,
    paciente: row.paciente ?? '',
    receita: row.receita_dados,
    obito: row.dados_pedido,
  }
}

export class SupervisionService {
  async listarVeterinarios(): Promise<VeterinarianOption[]> {
    const { data, error } = await supabase.rpc('veterinarios_disponiveis')
    if (error) throw new Error(error.message)
    return ((data ?? []) as VeterinarianRow[]).map((row) => ({
      profileId: row.profile_id,
      medicoId: row.medico_id,
      nome: row.nome,
      crmv: row.crmv,
      email: row.email,
    }))
  }

  async listarEstudantes(): Promise<StudentOption[]> {
    const { data, error } = await supabase.rpc('estudantes_disponiveis')
    if (error) throw new Error(error.message)
    return ((data ?? []) as StudentRow[]).map((row) => ({
      profileId: row.profile_id,
      nome: row.nome,
      matricula: row.matricula ?? '',
    }))
  }

  async liberarComSenha(
    supervisorId: string,
    senha: string,
    participantes: string[],
    alvo: AlvoLiberacao,
  ): Promise<string | null> {
    const { data, error } = await supabase.rpc('liberar_atendimento', {
      p_supervisor: supervisorId,
      p_senha: senha,
      p_participantes: participantes,
      ...alvoParams(alvo),
    })
    if (error) throw new Error(error.message)
    return (data as string | null) ?? null
  }

  async solicitar(supervisorId: string, participantes: string[], alvo: AlvoLiberacao): Promise<string> {
    const { data, error } = await supabase.rpc('solicitar_liberacao', {
      p_supervisor: supervisorId,
      p_participantes: participantes,
      ...alvoParams(alvo),
    })
    if (error) throw new Error(error.message)
    return data as string
  }

  async cancelar(liberacaoId: string): Promise<void> {
    const { error } = await supabase.rpc('cancelar_liberacao', { p_liberacao: liberacaoId })
    if (error) throw new Error(error.message)
  }

  async buscarSituacao(liberacaoId: string): Promise<SituacaoLiberacao | null> {
    const { data, error } = await supabase
      .from('liberacoes_atendimento')
      .select('status, motivo_recusa, prescricao_id, obito_id')
      .eq('id', liberacaoId)
      .maybeSingle<SituacaoRow>()
    if (error) throw new Error(error.message)
    if (!data) return null
    return {
      status: data.status,
      motivoRecusa: data.motivo_recusa ?? '',
      prescricaoId: data.prescricao_id,
      obitoId: data.obito_id,
    }
  }

  async responder(liberacaoId: string, aprovar: boolean, motivo: string | null = null): Promise<void> {
    const { error } = await supabase.rpc('responder_liberacao', {
      p_liberacao: liberacaoId,
      p_aprovar: aprovar,
      p_motivo: motivo,
    })
    if (error) throw new Error(error.message)
  }

  async listarPendentes(): Promise<PedidoLiberacao[]> {
    const { data, error } = await supabase.rpc('pedidos_liberacao_pendentes')
    if (error) throw new Error(error.message)
    return ((data ?? []) as PedidoRow[]).map(rowToPedido)
  }

  async emitirReceita(liberacaoId: string): Promise<string> {
    const { data, error } = await supabase.rpc('emitir_receita', { p_liberacao: liberacaoId })
    if (error) throw new Error('Não foi possível emitir a receita aprovada. Tente novamente.')
    return data as string
  }

  async registrarObito(liberacaoId: string): Promise<number> {
    const { data, error } = await supabase.rpc('registrar_obito_liberado', { p_liberacao: liberacaoId })
    if (error) throw new Error('Não foi possível concluir o registro de óbito aprovado. Tente novamente.')
    return data as number
  }

  observar(filter: string, onChange: () => void): () => void {
    const channel = supabase
      .channel(`liberacoes-${filter}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'liberacoes_atendimento', filter }, onChange)
      .subscribe()
    const interval = window.setInterval(onChange, 10000)
    return () => {
      window.clearInterval(interval)
      void supabase.removeChannel(channel)
    }
  }
}
