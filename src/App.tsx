import { useEffect, useState } from 'react'
import { LoginPage } from './features/auth/LoginPage'
import type { UserRole } from './features/auth/LoginPage'
import { VeterinarianDashboard } from './features/veterinarian/VeterinarianDashboard'
import { AttendantDashboard } from './features/attendant/AttendantDashboard'
import { supabase } from './services/storage/supabaseClient'
import './App.css'

function readRole(role: unknown): UserRole | null {
  return role === 'veterinarian' || role === 'attendant' ? role : null
}

function App() {
  const [role, setRole] = useState<UserRole | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setRole(readRole(data.session?.user.user_metadata.role))
      setCheckingSession(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      setRole(readRole(session?.user.user_metadata.role))
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
    return <VeterinarianDashboard onLogout={logout} />
  }

  if (role === 'attendant') {
    return <AttendantDashboard onLogout={logout} />
  }

  return <LoginPage onLogin={setRole} />
}

export default App
