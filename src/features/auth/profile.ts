import { supabase } from '../../services/storage/supabaseClient'

export type UserRole = 'veterinarian' | 'attendant'
export type ProfileStatus = 'pendente' | 'aprovado' | 'suspenso'

export type Profile = {
  id: string
  name: string
  email: string
  role: UserRole | null
  crmv: string | null
  matricula: string | null
  is_admin: boolean
  status: ProfileStatus
  email_confirmado: boolean
  created_at: string
}

export type AccessResult = { ok: true; role: UserRole; profile: Profile } | { ok: false; message: string }

export async function checkAccess(userId: string): Promise<AccessResult> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle<Profile>()

  if (error) return { ok: false, message: 'Não foi possível verificar seu cadastro. Tente novamente.' }
  if (!data) return { ok: false, message: 'Perfil de acesso não encontrado. Procure um administrador.' }
  if (data.status === 'pendente') {
    return { ok: false, message: 'Seu cadastro ainda não foi aprovado. Aguarde a liberação de um administrador.' }
  }
  if (data.status === 'suspenso') {
    return { ok: false, message: 'Seu acesso está suspenso. Procure um administrador.' }
  }
  if (data.role !== 'veterinarian' && data.role !== 'attendant') {
    return { ok: false, message: 'O usuário não possui um perfil de acesso válido.' }
  }
  return { ok: true, role: data.role, profile: data }
}
