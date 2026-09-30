import { useState } from 'react'
import type { FormEvent } from 'react'
import { BrandMark } from '../../components/common/BrandMark'
import { Icon } from '../../components/common/Icon'
import { AuthField } from './AuthField'
import { RegisterSuccess } from './RegisterSuccess'
import { UFS, formatMatricula, registerUser, validateRegistration, type RegistrationData } from './registration'

type RegisterPageProps = {
  onBack: () => void
}

const EMPTY_REGISTRATION: RegistrationData = {
  name: '',
  email: '',
  password: '',
  confirm: '',
  role: 'veterinarian',
  crmvUf: 'ES',
  crmvNumero: '',
  matricula: '',
}

const ROLE_LABELS = { veterinarian: '🩺 Veterinário(a)', attendant: '📚 Estudante' } as const

export function RegisterPage({ onBack }: RegisterPageProps) {
  const [data, setData] = useState(EMPTY_REGISTRATION)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  function set<K extends keyof RegistrationData>(key: K, value: RegistrationData[K]) {
    setData((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    const invalid = validateRegistration(data)
    if (invalid) {
      setMessage(invalid)
      return
    }
    setLoading(true)
    const error = await registerUser(data)
    setLoading(false)
    if (error) setMessage(error)
    else setSuccess(true)
  }

  if (success) return <RegisterSuccess email={data.email} onBack={onBack} />

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="register-title">
        <header className="login-brand">
          <BrandMark />
          <h1 id="register-title">DiagnoVetis</h1>
          <p>IFES Santa Teresa</p>
          <p className="brand-subtitle">Criar nova conta</p>
        </header>

        <form className="login-form" onSubmit={submit}>
          <label>Perfil de acesso</label>
          <div className="role-options">
            {(['veterinarian', 'attendant'] as const).map((role) => (
              <button
                key={role}
                type="button"
                className={`role-option${data.role === role ? ' active' : ''}`}
                onClick={() => set('role', role)}
              >
                {ROLE_LABELS[role]}
              </button>
            ))}
          </div>

          <AuthField
            id="reg-name"
            label="Nome completo"
            icon="user"
            type="text"
            placeholder="Ex: Maria da Silva"
            value={data.name}
            onChange={(event) => set('name', event.target.value)}
            required
          />
          <AuthField
            id="reg-email"
            label="E-mail"
            icon="mail"
            type="email"
            autoComplete="email"
            placeholder="seu.email@ifes.edu.br"
            value={data.email}
            onChange={(event) => set('email', event.target.value)}
            required
          />
          <AuthField
            id="reg-password"
            label="Senha"
            icon="lock"
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo 6 caracteres"
            value={data.password}
            onChange={(event) => set('password', event.target.value)}
            required
          />
          <AuthField
            id="reg-confirm"
            label="Confirmar senha"
            icon="lock"
            type="password"
            autoComplete="new-password"
            placeholder="Repita a senha"
            value={data.confirm}
            onChange={(event) => set('confirm', event.target.value)}
            required
          />

          {data.role === 'veterinarian' && (
            <>
              <label htmlFor="reg-crmv">CRMV</label>
              <div className="crmv-fields">
                <select
                  id="reg-crmv-uf"
                  className="crmv-uf"
                  aria-label="UF do CRMV"
                  value={data.crmvUf}
                  onChange={(event) => set('crmvUf', event.target.value)}
                >
                  {UFS.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
                <div className="input-wrap crmv-number">
                  <Icon>
                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                    <rect x="9" y="3" width="6" height="4" rx="1" />
                  </Icon>
                  <input
                    id="reg-crmv"
                    type="text"
                    inputMode="numeric"
                    placeholder="Número. Ex: 12345"
                    value={data.crmvNumero}
                    onChange={(event) => set('crmvNumero', event.target.value.replace(/\D/g, '').slice(0, 10))}
                    required
                  />
                </div>
              </div>
            </>
          )}

          {data.role === 'attendant' && (
            <AuthField
              id="reg-matricula"
              label="Matrícula"
              icon="card"
              type="text"
              placeholder="Sua matrícula no IFES"
              value={data.matricula}
              onChange={(event) => set('matricula', formatMatricula(event.target.value))}
              required
            />
          )}

          {message && (
            <p className="form-message error" role="status">
              {message}
            </p>
          )}

          <button className="submit-button" type="submit" disabled={loading}>
            {loading ? 'Cadastrando...' : 'Criar conta'}
          </button>
        </form>

        <footer>
          <button type="button" className="auth-link" onClick={onBack}>
            ← Já tenho uma conta
          </button>
        </footer>
      </section>
    </main>
  )
}
