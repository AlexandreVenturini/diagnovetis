import { useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { LoginPage } from './features/auth/LoginPage'
import type { UserRole } from './features/auth/LoginPage'
import { RegisterPage } from './features/auth/RegisterPage'
import { checkAccess } from './features/auth/profile'
import { VeterinarianDashboard } from './features/veterinarian/VeterinarianDashboard'
import { AttendantDashboard } from './features/attendant/AttendantDashboard'
import { supabase } from './services/storage/supabaseClient'

type AuthUser = { email: string; name: string; isAdmin: boolean }

function App() {
  const [role, setRole] = useState<UserRole | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [notice, setNotice] = useState('')
  const requestId = useRef(0)

  async function applySession(sessionUser: User | null | undefined) {
    const current = ++requestId.current

    if (!sessionUser) {
      setRole(null)
      setUser(null)
      setCheckingSession(false)
      return
    }

    const access = await checkAccess(sessionUser.id)
    if (current !== requestId.current) return

    if (!access.ok) {
      setRole(null)
      setUser(null)
      setNotice(access.message)
      setCheckingSession(false)
      await supabase.auth.signOut()
      return
    }

    setNotice('')
    setRegistering(false)
    setRole(access.role)
    setUser({ email: access.profile.email, name: access.profile.name, isAdmin: access.profile.is_admin })
    setCheckingSession(false)
  }

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (active) void applySession(data.session?.user)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') return
      setTimeout(() => {
        if (active) void applySession(session?.user)
      }, 0)
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
    return (
      <main className="auth-loading" role="status">
        Verificando sessão...
      </main>
    )
  }

  if (role === 'veterinarian') {
    return <VeterinarianDashboard onLogout={logout} user={user} />
  }

  if (role === 'attendant') {
    return <AttendantDashboard onLogout={logout} user={user} />
  }

  if (registering) {
    return <RegisterPage onBack={() => setRegistering(false)} />
  }

  return (
    <LoginPage
      notice={notice}
      onDismissNotice={() => setNotice('')}
      onRegister={() => {
        setNotice('')
        setRegistering(true)
      }}
    />
  )
}

export default App
