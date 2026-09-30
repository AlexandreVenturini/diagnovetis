import type { Profile } from '../features/auth/profile'
import { supabase } from './storage/supabaseClient'

export type ProfileChanges = Partial<Pick<Profile, 'status' | 'is_admin'>>

export class ProfileService {
  async buscar(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle<Profile>()
    if (error) throw new Error(error.message)
    return data
  }

  async listar(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .returns<Profile[]>()
    if (error) throw new Error(error.message)
    return data ?? []
  }

  async atualizar(userId: string, changes: ProfileChanges): Promise<void> {
    const { error } = await supabase.from('profiles').update(changes).eq('id', userId)
    if (error) throw new Error(error.message)
  }

  async remover(userId: string): Promise<void> {
    const { error } = await supabase.rpc('admin_remover_usuario', { p_user_id: userId })
    if (error) throw new Error(error.message)
  }

  async cadastroEmUso(crmv: string | null, matricula: string | null): Promise<'crmv' | 'matricula' | null> {
    const { data, error } = await supabase.rpc('cadastro_disponivel', { p_crmv: crmv, p_matricula: matricula })
    if (error) throw new Error(error.message)
    return data === 'crmv' || data === 'matricula' ? data : null
  }
}
