import { supabase } from '../../services/storage/supabaseClient'
import type { PrescricaoSalva } from '../../models/Prescricao'

export type ReceitaParaAprovar = { petId: number; dados: PrescricaoSalva }
export type ObitoDados = {
  data_hora: string
  circunstancias: string
  causa_provavel: string
  houve_reanimacao: boolean
  eutanasia: boolean
  medico_responsavel_id: number
  comunicado_responsavel: boolean
  comunicacao_detalhes: string
  necropsia: boolean
  destino_corpo: string
  consulta_id?: number | null
}
export type ObitoParaAprovar = { petId: number; dados: ObitoDados }

const pedidoExtra = (receita: ReceitaParaAprovar | null, obito: ObitoParaAprovar | null) => ({
  p_receita_pet: receita?.petId ?? null,
  p_receita_dados: receita?.dados ?? null,
  p_tipo: obito ? 'obito' : null,
  p_pet_alvo: obito?.petId ?? null,
  p_dados: obito?.dados ?? null,
})

export type VeterinarianOption = { profileId: string; medicoId: number; nome: string; crmv: string; email: string }
export type StudentOption = { profileId: string; nome: string; matricula: string }
export type Liberacao = { id: string; supervisor: VeterinarianOption; participantes: StudentOption[] }

type VeterinarianRow = { profile_id: string; medico_id: number; nome: string; crmv: string; email: string }
type StudentRow = { profile_id: string; nome: string; matricula: string | null }

export async function listarVeterinarios(): Promise<VeterinarianOption[]> {
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

export async function listarEstudantes(): Promise<StudentOption[]> {
  const { data, error } = await supabase.rpc('estudantes_disponiveis')
  if (error) throw new Error(error.message)
  return ((data ?? []) as StudentRow[]).map((row) => ({
    profileId: row.profile_id,
    nome: row.nome,
    matricula: row.matricula ?? '',
  }))
}

export async function liberarAtendimento(
  supervisorId: string,
  senha: string,
  participantes: string[],
  consultaId: number | null = null,
  receita: ReceitaParaAprovar | null = null,
  obito: ObitoParaAprovar | null = null,
): Promise<string | null> {
  const { data, error } = await supabase.rpc('liberar_atendimento', {
    p_supervisor: supervisorId,
    p_senha: senha,
    p_participantes: participantes,
    p_consulta: consultaId,
    ...pedidoExtra(receita, obito),
  })
  if (error) throw new Error(error.message)
  return (data as string | null) ?? null
}

export async function cancelarLiberacao(liberacaoId: string): Promise<void> {
  const { error } = await supabase.rpc('cancelar_liberacao', { p_liberacao: liberacaoId })
  if (error) throw new Error(error.message)
}

export type LiberacaoStatus = 'pendente' | 'aberta' | 'recusada' | 'finalizada' | 'cancelada'
export type TipoLiberacao = 'atendimento' | 'retificacao' | 'receita' | 'obito'
export type PedidoLiberacao = {
  id: string
  alunoNome: string
  alunoMatricula: string
  participantes: string[]
  criadaEm: string
  tipo: TipoLiberacao
  consultaAlvo: number | null
  paciente: string
  receita: PrescricaoSalva | null
  obito: ObitoDados | null
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

export const LIBERACAO_EXPIRA_MS = 30 * 60 * 1000

export async function solicitarLiberacao(
  supervisorId: string,
  participantes: string[],
  consultaId: number | null = null,
  receita: ReceitaParaAprovar | null = null,
  obito: ObitoParaAprovar | null = null,
): Promise<string> {
  const { data, error } = await supabase.rpc('solicitar_liberacao', {
    p_supervisor: supervisorId,
    p_participantes: participantes,
    p_consulta: consultaId,
    ...pedidoExtra(receita, obito),
  })
  if (error) throw new Error(error.message)
  return data as string
}

export type SituacaoLiberacao = {
  status: LiberacaoStatus
  motivoRecusa: string
  prescricaoId: string | null
  obitoId: number | null
}

export async function buscarStatusLiberacao(liberacaoId: string): Promise<SituacaoLiberacao | null> {
  const { data, error } = await supabase
    .from('liberacoes_atendimento')
    .select('status, motivo_recusa, prescricao_id, obito_id')
    .eq('id', liberacaoId)
    .maybeSingle<{
      status: LiberacaoStatus
      motivo_recusa: string | null
      prescricao_id: string | null
      obito_id: number | null
    }>()
  if (error) throw new Error(error.message)
  return data
    ? {
        status: data.status,
        motivoRecusa: data.motivo_recusa ?? '',
        prescricaoId: data.prescricao_id,
        obitoId: data.obito_id,
      }
    : null
}

export async function registrarObitoLiberado(liberacaoId: string): Promise<number> {
  const { data, error } = await supabase.rpc('registrar_obito_liberado', { p_liberacao: liberacaoId })
  if (error) throw new Error('Não foi possível concluir o registro de óbito aprovado. Tente novamente.')
  return data as number
}

export async function emitirReceita(liberacaoId: string): Promise<string> {
  const { data, error } = await supabase.rpc('emitir_receita', { p_liberacao: liberacaoId })
  if (error) throw new Error('Não foi possível emitir a receita aprovada. Tente novamente.')
  return data as string
}

export async function responderLiberacao(
  liberacaoId: string,
  aprovar: boolean,
  motivo: string | null = null,
): Promise<void> {
  const { error } = await supabase.rpc('responder_liberacao', {
    p_liberacao: liberacaoId,
    p_aprovar: aprovar,
    p_motivo: motivo,
  })
  if (error) throw new Error(error.message)
}

export async function listarPedidosPendentes(): Promise<PedidoLiberacao[]> {
  const { data, error } = await supabase.rpc('pedidos_liberacao_pendentes')
  if (error) throw new Error(error.message)
  return ((data ?? []) as PedidoRow[]).map((row) => ({
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
