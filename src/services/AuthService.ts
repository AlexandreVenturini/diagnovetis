import type { AuthChangeEvent, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from './storage/supabaseClient'

export type SessionUser = User

export type SignUpData = {
  email: string
  password: string
  metadata: Record<string, string | undefined>
}

export class AuthService {
  readonly configurado = isSupabaseConfigured

  async usuarioDaSessao(): Promise<SessionUser | null> {
    const { data } = await supabase.auth.getSession()
    return data.session?.user ?? null
  }

  async usuarioAtual(): Promise<SessionUser | null> {
    const { data } = await supabase.auth.getUser()
    return data.user
  }

  observarSessao(onChange: (event: AuthChangeEvent, user: SessionUser | null) => void): () => void {
    const { data } = supabase.auth.onAuthStateChange((event, session) => onChange(event, session?.user ?? null))
    return () => data.subscription.unsubscribe()
  }

  async entrar(email: string, password: string): Promise<{ code?: string; message: string } | null> {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error ? { code: error.code, message: error.message } : null
  }

  async sair(): Promise<void> {
    await supabase.auth.signOut()
  }

  async cadastrar({ email, password, metadata }: SignUpData): Promise<{ error: string; comSessao: boolean }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin, data: metadata },
    })
    return { error: error?.message ?? '', comSessao: Boolean(data.session) }
  }
}
