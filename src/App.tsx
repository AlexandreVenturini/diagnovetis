import { useState } from 'react'
import { LoginPage } from './features/auth/LoginPage'
import { RegisterPage } from './features/auth/RegisterPage'
import { VeterinarianDashboard } from './features/veterinarian/VeterinarianDashboard'
import { AttendantDashboard } from './features/attendant/AttendantDashboard'
import './App.css'

type AppScreen = 'login' | 'register' | 'veterinarian' | 'attendant'

function App() {
  const [screen, setScreen] = useState<AppScreen>('login')

  if (screen === 'veterinarian') {
    return <VeterinarianDashboard onLogout={() => setScreen('login')} />
  }

  if (screen === 'attendant') {
    return <AttendantDashboard onLogout={() => setScreen('login')} />
  }

  if (screen === 'register') {
    return <RegisterPage onBack={() => setScreen('login')} />
  }

  return (
    <LoginPage
      onLogin={(role) => setScreen(role)}
      onCreateAccount={() => setScreen('register')}
    />
  )
}

export default App
