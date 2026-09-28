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

export async function liberarAtendimento(supervisorId: string, senha: string, participantes: string[]): Promise<string | null> {
  const { data, error } = await supabase.rpc('liberar_atendimento', { p_supervisor: supervisorId, p_senha: senha, p_participantes: participantes })
  if (error) throw new Error(error.message)
  return (data as string | null) ?? null
}

export async function cancelarLiberacao(liberacaoId: string): Promise<void> {
  const { error } = await supabase.rpc('cancelar_liberacao', { p_liberacao: liberacaoId })
  if (error) throw new Error(error.message)
}
