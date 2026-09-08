import { useState } from 'react'
import type { FormEvent } from 'react'
import { BrandMark } from '../../components/common/BrandMark'
import { Icon } from '../../components/common/Icon'
import { supabase } from '../../services/storage/supabaseClient'

export type UserRole = 'veterinarian' | 'attendant'

type LoginPageProps = {
  onLogin: (role: UserRole) => void
  onRegister: () => void
}

export function LoginPage({ onLogin, onRegister }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    const role = data.user.user_metadata.role
    if (role !== 'veterinarian' && role !== 'attendant') {
      await supabase.auth.signOut()
      setMessage('O usuário não possui um perfil de acesso válido.')
      setLoading(false)
      return
    }

    onLogin(role)
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
          <label htmlFor="email">E-mail</label>
          <div className="input-wrap">
            <Icon><circle cx="12" cy="8" r="3.25" /><path d="M5.5 20v-1.5a6.5 6.5 0 0 1 13 0V20" /></Icon>
            <input id="email" type="email" autoComplete="email" placeholder="seu.email@ifes.edu.br" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>

          <label htmlFor="password">Senha</label>
          <div className="input-wrap">
            <Icon><rect x="4.5" y="10" width="15" height="10.5" rx="1.5" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></Icon>
            <input id="password" type="password" autoComplete="current-password" placeholder="Digite sua senha" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </div>

          {message && <p className="form-message error" role="status">{message}</p>}
          <button className="submit-button" type="submit" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
        </form>

        <footer>
          <p>Sistema de Gerenciamento de Atendimento Veterinário</p>
          <p>IFES - Instituto Federal do Espírito Santo</p>
          <button
            type="button"
            onClick={onRegister}
            style={{ marginTop: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: '0.875rem' }}
          >
            Criar nova conta
          </button>
        </footer>
      </section>
    </main>
  )
}
