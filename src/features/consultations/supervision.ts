import { supabase } from '../../services/storage/supabaseClient'

export type VeterinarianOption = { profileId: string; medicoId: number; nome: string; crmv: string; email: string }
export type StudentOption = { profileId: string; nome: string; matricula: string }
export type Liberacao = { id: string; supervisor: VeterinarianOption; participantes: StudentOption[] }

type VeterinarianRow = { profile_id: string; medico_id: number; nome: string; crmv: string; email: string }
type StudentRow = { profile_id: string; nome: string; matricula: string | null }

export async function listarVeterinarios(): Promise<VeterinarianOption[]> {
  const { data, error } = await supabase.rpc('veterinarios_disponiveis')
  if (error) throw new Error(error.message)
  return ((data ?? []) as VeterinarianRow[]).map((row) => ({ profileId: row.profile_id, medicoId: row.medico_id, nome: row.nome, crmv: row.crmv, email: row.email }))
}

export async function listarEstudantes(): Promise<StudentOption[]> {
  const { data, error } = await supabase.rpc('estudantes_disponiveis')
  if (error) throw new Error(error.message)
  return ((data ?? []) as StudentRow[]).map((row) => ({ profileId: row.profile_id, nome: row.nome, matricula: row.matricula ?? '' }))
}

export async function liberarAtendimento(supervisorId: string, senha: string, participantes: string[], consultaId: number | null = null): Promise<string | null> {
  const { data, error } = await supabase.rpc('liberar_atendimento', { p_supervisor: supervisorId, p_senha: senha, p_participantes: participantes, p_consulta: consultaId })
  if (error) throw new Error(error.message)
  return (data as string | null) ?? null
}

export async function cancelarLiberacao(liberacaoId: string): Promise<void> {
  const { error } = await supabase.rpc('cancelar_liberacao', { p_liberacao: liberacaoId })
  if (error) throw new Error(error.message)
}

export type LiberacaoStatus = 'pendente' | 'aberta' | 'recusada' | 'finalizada' | 'cancelada'
export type PedidoLiberacao = { id: string; alunoNome: string; alunoMatricula: string; participantes: string[]; criadaEm: string; tipo: 'atendimento' | 'retificacao'; consultaAlvo: number | null; paciente: string }

type PedidoRow = { id: string; aluno_nome: string; aluno_matricula: string | null; participantes: string[] | null; criada_em: string; tipo: 'atendimento' | 'retificacao' | null; consulta_alvo: number | null; paciente: string | null }

export const LIBERACAO_EXPIRA_MS = 30 * 60 * 1000

export async function solicitarLiberacao(supervisorId: string, participantes: string[], consultaId: number | null = null): Promise<string> {
  const { data, error } = await supabase.rpc('solicitar_liberacao', { p_supervisor: supervisorId, p_participantes: participantes, p_consulta: consultaId })
  if (error) throw new Error(error.message)
  return data as string
}

export async function buscarStatusLiberacao(liberacaoId: string): Promise<LiberacaoStatus | null> {
  const { data, error } = await supabase.from('liberacoes_atendimento').select('status').eq('id', liberacaoId).maybeSingle<{ status: LiberacaoStatus }>()
  if (error) throw new Error(error.message)
  return data?.status ?? null
}

export async function responderLiberacao(liberacaoId: string, aprovar: boolean): Promise<void> {
  const { error } = await supabase.rpc('responder_liberacao', { p_liberacao: liberacaoId, p_aprovar: aprovar })
  if (error) throw new Error(error.message)
}

export async function listarPedidosPendentes(): Promise<PedidoLiberacao[]> {
  const { data, error } = await supabase.rpc('pedidos_liberacao_pendentes')
  if (error) throw new Error(error.message)
  return ((data ?? []) as PedidoRow[]).map((row) => ({
    id: row.id, alunoNome: row.aluno_nome, alunoMatricula: row.aluno_matricula ?? '', participantes: row.participantes ?? [], criadaEm: row.criada_em,
    tipo: row.tipo ?? 'atendimento', consultaAlvo: row.consulta_alvo, paciente: row.paciente ?? '',
  }))
}

export function observarLiberacoes(filter: string, onChange: () => void): () => void {
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
