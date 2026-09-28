import { useState } from 'react'
import type { FormEvent } from 'react'
import { BrandMark } from '../../components/common/BrandMark'
import { Icon } from '../../components/common/Icon'
import { supabase } from '../../services/storage/supabaseClient'
import type { UserRole } from './LoginPage'

const UFS = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO']

type RegisterPageProps = {
  onBack: () => void
}

export function RegisterPage({ onBack }: RegisterPageProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [role, setRole] = useState<UserRole>('veterinarian')
  const [crmvUf, setCrmvUf] = useState('ES')
  const [crmvNumero, setCrmvNumero] = useState('')
  const [matricula, setMatricula] = useState('')
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  function formatMatricula(value: string) {
    return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    if (password !== confirm) {
      setMessage('As senhas não coincidem.')
      return
    }
    if (password.length < 6) {
      setMessage('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (role === 'veterinarian' && !/^\d{1,6}$/.test(crmvNumero)) {
      setMessage('Informe o número do CRMV (somente números).')
      return
    }
    if (role === 'attendant' && matricula.length < 4) {
      setMessage('Informe sua matrícula do IFES.')
      return
    }

    const crmv = role === 'veterinarian' ? `${crmvUf}-${Number(crmvNumero)}` : undefined
    const matriculaFinal = role === 'attendant' ? matricula : undefined

    setLoading(true)

    const { data: emUso, error: checkError } = await supabase.rpc('cadastro_disponivel', { p_crmv: crmv ?? null, p_matricula: matriculaFinal ?? null })
    if (checkError) {
      setLoading(false)
      setMessage('Não foi possível verificar os dados do cadastro. Tente novamente.')
      return
    }
    if (emUso === 'crmv') {
      setLoading(false)
      setMessage('Este CRMV já está cadastrado. Se ele é seu, procure um administrador.')
      return
    }
    if (emUso === 'matricula') {
      setLoading(false)
      setMessage('Esta matrícula já está cadastrada. Se ela é sua, procure um administrador.')
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { role, name: name.trim(), crmv, matricula: matriculaFinal },
      },
    })

    setLoading(false)

    if (error) {
      setMessage(error.message.includes('Database error')
        ? 'Não foi possível criar a conta. Verifique se o CRMV ou a matrícula já estão em uso.'
        : error.message)
      return
    }

    if (data.session) {
      await supabase.auth.signOut()
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <main className="login-page">
        <section className="login-card" aria-labelledby="register-title">
          <header className="login-brand">
            <BrandMark />
            <h1 id="register-title">DiagnoVetis</h1>
            <p className="brand-subtitle">Cadastro realizado!</p>
          </header>
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <p style={{ marginBottom: '0.75rem' }}>
              Enviamos um e-mail de confirmação para <strong>{email}</strong>.<br />
              Acesse o link no e-mail para confirmar seu endereço.
            </p>
            <p style={{ marginBottom: '0.75rem', fontSize: '0.875rem' }}>
              Não encontrou? Verifique também a caixa de spam ou lixo eletrônico.
            </p>
            <p style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
              Depois da confirmação, seu cadastro ainda precisa ser aprovado por um administrador para liberar o acesso.
            </p>
            <button className="submit-button" onClick={onBack}>Voltar para o login</button>
          </div>
        </section>
      </main>
    )
  }

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
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
            {(['veterinarian', 'attendant'] as const).map((r) => {
              const active = role === r
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  style={{
                    flex: 1,
                    padding: '0.65rem 0.5rem',
                    borderRadius: '8px',
                    border: `2px solid ${active ? 'var(--color-primary, #2563eb)' : '#9ca3af'}`,
                    background: active ? 'var(--color-primary, #2563eb)' : 'transparent',
                    color: active ? '#ffffff' : 'var(--color-text, #111827)',
                    cursor: 'pointer',
                    fontWeight: active ? 600 : 400,
                    fontSize: '0.875rem',
                    transition: 'all 0.15s',
                  }}
                >
                  {r === 'veterinarian' ? '🩺 Veterinário(a)' : '📚 Estudante'}
                </button>
              )
            })}
          </div>

          <label htmlFor="reg-name">Nome completo</label>
          <div className="input-wrap">
            <Icon><circle cx="12" cy="8" r="3.25" /><path d="M5.5 20v-1.5a6.5 6.5 0 0 1 13 0V20" /></Icon>
            <input
              id="reg-name"
              type="text"
              placeholder="Ex: Maria da Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <label htmlFor="reg-email">E-mail</label>
          <div className="input-wrap">
            <Icon><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Icon>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              placeholder="seu.email@ifes.edu.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <label htmlFor="reg-password">Senha</label>
          <div className="input-wrap">
            <Icon><rect x="4.5" y="10" width="15" height="10.5" rx="1.5" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></Icon>
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <label htmlFor="reg-confirm">Confirmar senha</label>
          <div className="input-wrap">
            <Icon><rect x="4.5" y="10" width="15" height="10.5" rx="1.5" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></Icon>
            <input
              id="reg-confirm"
              type="password"
              autoComplete="new-password"
              placeholder="Repita a senha"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>

          {role === 'veterinarian' && (
            <>
              <label htmlFor="reg-crmv">CRMV</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  id="reg-crmv-uf"
                  aria-label="UF do CRMV"
                  value={crmvUf}
                  onChange={(e) => setCrmvUf(e.target.value)}
                  style={{ padding: '0 0.5rem', borderRadius: '8px', border: '1px solid #d1d5db', background: 'transparent', color: 'inherit' }}
                >
                  {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                </select>
                <div className="input-wrap" style={{ flex: 1 }}>
                  <Icon><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /></Icon>
                  <input
                    id="reg-crmv"
                    type="text"
                    inputMode="numeric"
                    placeholder="Número. Ex: 12345"
                    value={crmvNumero}
                    onChange={(e) => setCrmvNumero(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                  />
                </div>
              </div>
            </>
          )}

          {role === 'attendant' && (
            <>
              <label htmlFor="reg-matricula">Matrícula</label>
              <div className="input-wrap">
                <Icon><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 9h6M7 13h10" /></Icon>
                <input
                  id="reg-matricula"
                  type="text"
                  placeholder="Sua matrícula no IFES"
                  value={matricula}
                  onChange={(e) => setMatricula(formatMatricula(e.target.value))}
                  required
                />
              </div>
            </>
          )}

          {message && <p className="form-message error" role="status">{message}</p>}

          <button className="submit-button" type="submit" disabled={loading}>
            {loading ? 'Cadastrando...' : 'Criar conta'}
          </button>
        </form>

        <footer>
          <button
            type="button"
            onClick={onBack}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: '0.875rem' }}
          >
            ← Já tenho uma conta
          </button>
        </footer>
      </section>
    </main>
  )
}
