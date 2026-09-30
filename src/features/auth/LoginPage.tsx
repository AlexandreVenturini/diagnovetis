import { useState } from 'react'
import type { FormEvent } from 'react'
import { BrandMark } from '../../components/common/BrandMark'
import { AuthField } from './AuthField'
import { isSupabaseConfigured, supabase } from '../../services/storage/supabaseClient'

type LoginPageProps = {
  notice: string
  onDismissNotice: () => void
  onRegister: () => void
}

function translateAuthError(code: string | undefined, fallback: string) {
  if (code === 'email_not_confirmed') {
    return 'Seu e-mail ainda não foi confirmado. Acesse o link que enviamos (verifique também a caixa de spam).'
  }
  if (code === 'invalid_credentials') return 'E-mail ou senha incorretos.'
  return fallback
}

export function LoginPage({ notice, onDismissNotice, onRegister }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    onDismissNotice()
    if (!isSupabaseConfigured) {
      setMessage(
        'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (ou VITE_SUPABASE_KEY) no arquivo .env.local e reinicie o servidor local.',
      )
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        setMessage(translateAuthError(error.code, error.message))
      }
    } catch {
      setMessage('Não foi possível conectar ao serviço de login. Verifique sua conexão e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <header className="login-brand">
          <BrandMark />
          <h1 id="login-title">DiagnoVetis</h1>
          <p>IFES Santa Teresa</p>
          <p className="brand-subtitle">Sistema de Gestão Veterinária</p>
        </header>

        <form className="login-form" onSubmit={submit}>
          <AuthField
            id="email"
            label="E-mail"
            icon="user"
            type="email"
            autoComplete="email"
            placeholder="seu.email@ifes.edu.br"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <AuthField
            id="password"
            label="Senha"
            icon="lock"
            type="password"
            autoComplete="current-password"
            placeholder="Digite sua senha"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {(message || notice) && (
            <p className="form-message error" role="status">
              {message || notice}
            </p>
          )}
          <button className="submit-button" type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <footer>
          <p>Sistema de Gerenciamento de Atendimento Veterinário</p>
          <p>IFES - Instituto Federal do Espírito Santo</p>
          <button type="button" className="auth-link auth-link--spaced" onClick={onRegister}>
            Criar nova conta
          </button>
        </footer>
      </section>
    </main>
  )
}
