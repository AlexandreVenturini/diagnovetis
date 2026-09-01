import { useState } from 'react'
import type { FormEvent } from 'react'
import { BrandMark } from '../../components/common/BrandMark'
import { Icon } from '../../components/common/Icon'

type RegisterPageProps = {
  onBack: () => void
}

export function RegisterPage({ onBack }: RegisterPageProps) {
  const [role, setRole] = useState<'veterinarian' | 'attendant'>('veterinarian')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [crmv, setCrmv] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)

  function changeRole(nextRole: 'veterinarian' | 'attendant') {
    setRole(nextRole)
    setCrmv('')
    setMessage('')
    setSuccess(false)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSuccess(false)

    if (!email.trim().toLowerCase().endsWith('@ifes.edu.br')) {
      setMessage('Informe um e-mail institucional válido do IFES.')
      return
    }
    if (role === 'veterinarian' && !/^(CRMV[-\s]?)?[A-Z]{2}[-\s]?\d{4,6}$/i.test(crmv.trim())) {
      setMessage('Informe um CRMV válido. Exemplo: CRMV-ES 1234.')
      return
    }
    if (password.length < 6) {
      setMessage('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (password !== confirmation) {
      setMessage('As senhas informadas não coincidem.')
      return
    }

    setSuccess(true)
    setMessage(`Cadastro de ${role === 'veterinarian' ? 'veterinário' : 'atendente'} para ${name.trim()} realizado com sucesso!`)
  }

  return (
    <main className="register-page">
      <section className="register-card" aria-labelledby="register-title">
        <header className="register-brand">
          <BrandMark />
          <h1 id="register-title">DiagnoVetis</h1>
          <p>IFES Santa Teresa</p>
          <p className="brand-subtitle">Cadastro de Acesso</p>
        </header>

        <form className="register-form" onSubmit={submit}>
          <div className="login-role-tabs register-role-tabs" role="tablist" aria-label="Tipo de conta">
            <button type="button" role="tab" aria-selected={role === 'veterinarian'} className={role === 'veterinarian' ? 'active' : ''} onClick={() => changeRole('veterinarian')}>Veterinário</button>
            <button type="button" role="tab" aria-selected={role === 'attendant'} className={role === 'attendant' ? 'active' : ''} onClick={() => changeRole('attendant')}>Atendente</button>
          </div>

          <label htmlFor="full-name">Nome Completo</label>
          <div className="input-wrap">
            <Icon><circle cx="12" cy="8" r="3.25" /><path d="M5.5 20v-1.5a6.5 6.5 0 0 1 13 0V20" /></Icon>
            <input id="full-name" type="text" autoComplete="name" placeholder="Seu nome completo" value={name} onChange={(event) => setName(event.target.value)} required />
          </div>

          <label htmlFor="register-email">E-mail</label>
          <div className="input-wrap">
            <Icon><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></Icon>
            <input id="register-email" type="email" autoComplete="email" placeholder="seu.email@ifes.edu.br" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>

          {role === 'veterinarian' && <><label htmlFor="register-crmv">CRMV</label><div className="input-wrap"><Icon><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></Icon><input id="register-crmv" value={crmv} onChange={(event) => setCrmv(event.target.value.toUpperCase())} placeholder="Ex.: CRMV-ES 1234" autoComplete="off" required /></div></>}

          <label htmlFor="register-password">Senha</label>
          <div className="input-wrap">
            <Icon><rect x="4.5" y="10" width="15" height="10.5" rx="1.5" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></Icon>
            <input id="register-password" type="password" autoComplete="new-password" placeholder="Crie sua senha" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} />
          </div>

          <label htmlFor="confirm-password">Confirmar Senha</label>
          <div className="input-wrap">
            <Icon><rect x="4.5" y="10" width="15" height="10.5" rx="1.5" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></Icon>
            <input id="confirm-password" type="password" autoComplete="new-password" placeholder="Repita sua senha" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required minLength={6} />
          </div>

          {message && <p className={`register-message ${success ? 'success' : 'error'}`} role="status">{message}</p>}
          <button className="submit-button" type="submit">Cadastrar</button>
        </form>

        <button className="back-to-login" type="button" onClick={onBack}>
          Já tem conta? <strong>Faça login</strong>
        </button>
      </section>
    </main>
  )
}
