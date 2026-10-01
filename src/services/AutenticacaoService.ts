import type { AuthChangeEvent, User } from '@supabase/supabase-js'
import { supabaseConfigurado, supabase } from './storage/supabaseClient'

export type UsuarioSessao = User

export type DadosNovaConta = {
  email: string
  senha: string
  metadados: Record<string, string | undefined>
}

export class AutenticacaoService {
  readonly configurado = supabaseConfigurado

  async usuarioDaSessao(): Promise<UsuarioSessao | null> {
    const { data: dados } = await supabase.auth.getSession()
    return dados.session?.user ?? null
  }

  async usuarioAtual(): Promise<UsuarioSessao | null> {
    const { data: dados } = await supabase.auth.getUser()
    return dados.user
  }

  observarSessao(aoAlterar: (evento: AuthChangeEvent, usuario: UsuarioSessao | null) => void): () => void {
    const { data: dados } = supabase.auth.onAuthStateChange((evento, sessao) => aoAlterar(evento, sessao?.user ?? null))
    return () => dados.subscription.unsubscribe()
  }

  async entrar(email: string, senha: string): Promise<{ codigo?: string; mensagem: string } | null> {
    const { error: erro } = await supabase.auth.signInWithPassword({ email, password: senha })
    return erro ? { codigo: erro.code, mensagem: erro.message } : null
  }

  async sair(): Promise<void> {
    await supabase.auth.signOut()
  }

  async cadastrar({ email, senha, metadados }: DadosNovaConta): Promise<{ erro: string; comSessao: boolean }> {
    const { data: dados, error: erro } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { emailRedirectTo: window.location.origin, data: metadados },
    })
    return { erro: erro?.message ?? '', comSessao: Boolean(dados.session) }
  }
}
