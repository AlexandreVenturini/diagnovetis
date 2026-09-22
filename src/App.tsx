import { useEffect, useState } from 'react'
import { LoginPage } from './features/auth/LoginPage'
import type { UserRole } from './features/auth/LoginPage'
import { RegisterPage } from './features/auth/RegisterPage'
import { VeterinarianDashboard } from './features/veterinarian/VeterinarianDashboard'
import { AttendantDashboard } from './features/attendant/AttendantDashboard'
import { supabase } from './services/storage/supabaseClient'
import './App.css'

function readRole(role: unknown): UserRole | null {
  return role === 'veterinarian' || role === 'attendant' ? role : null
}

type AuthUser = { email: string; name: string; isAdmin: boolean }

function App() {
  const [role, setRole] = useState<UserRole | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [registering, setRegistering] = useState(false)

  function applySession(sessionUser: { email?: string; user_metadata?: Record<string, unknown> } | null | undefined) {
    const meta = sessionUser?.user_metadata ?? {}
    setRole(readRole(meta.role))
    setUser(sessionUser ? { email: sessionUser.email ?? '', name: String(meta.name ?? ''), isAdmin: meta.is_admin === true } : null)
  }

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      applySession(data.session?.user)
      setCheckingSession(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      applySession(session?.user)
      setCheckingSession(false)
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  async function logout() {
    await supabase.auth.signOut()
  }

  if (checkingSession) {
    return <main className="auth-loading" role="status">Verificando sessão...</main>
  }

  if (role === 'veterinarian') {
    return <VeterinarianDashboard onLogout={logout} user={user} />
  }

  if (role === 'attendant') {
    return <AttendantDashboard onLogout={logout} user={user} />
  }

  if (registering) {
    return (
      <RegisterPage
        onBack={() => setRegistering(false)}
        onRegistered={(r) => { setRegistering(false); setRole(r) }}
      />
    )
  }

  return <LoginPage onLogin={setRole} onRegister={() => setRegistering(true)} />
}

export default App
