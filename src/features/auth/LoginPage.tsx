import { useState } from 'react'
import type { FormEvent } from 'react'
import { BrandMark } from '../../components/common/BrandMark'
import { Icon } from '../../components/common/Icon'

type LoginPageProps = {
  onLogin: (role: 'veterinarian' | 'attendant') => void
  onCreateAccount: () => void
}

export function LoginPage({ onLogin, onCreateAccount }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (email.trim().toLowerCase() === 'veterinario@ifes.edu.br' && password === 'vet123') {
      onLogin('veterinarian')
      return
    }

    if (email.trim().toLowerCase() === 'atendente@ifes.edu.br' && password === 'atd123') {
      onLogin('attendant')
      return
    }

    setMessage('E-mail ou senha inválidos.')
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
          <button className="submit-button" type="submit">Entrar</button>

          <nav className="login-links" aria-label="Opções de acesso">
            <button type="button">Esqueceu a senha?</button>
            <button type="button" onClick={onCreateAccount}>Criar conta</button>
          </nav>
        </form>

        <footer>
          <p>Sistema de Gerenciamento de Atendimento Veterinário</p>
          <p>IFES - Instituto Federal do Espírito Santo</p>
        </footer>
      </section>
    </main>
  )
}
