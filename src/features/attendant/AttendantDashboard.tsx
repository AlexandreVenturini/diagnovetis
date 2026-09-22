import { useState } from 'react'
import { Icon } from '../../components/common/Icon'
import { AppHeader } from '../../components/layout/AppHeader'
import { AdminPanel } from '../admin/AdminPanel'
import { AppointmentsModule } from '../appointments/AppointmentsModule'
import { DogDetails } from '../dogs/DogDetails'
import { DogForm } from '../dogs/DogForm'
import { DogList } from '../dogs/DogList'
import { useDogs } from '../../hooks/useDogs'
import type { Dog, DogFormData, DogScreen } from '../dogs/dogTypes'
import { AttendantHome } from './AttendantHome'

type AttendantDashboardProps = {
  onLogout: () => void
  user: { email: string; name: string; isAdmin: boolean } | null
}

type AttendantModule = 'dashboard' | 'dogs' | 'appointments'

type AppointmentEntry = { screen: 'list' | 'create'; key: number }

const NAV_ITEMS: { id: AttendantModule; label: string; icon: React.ReactNode }[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Icon><path d="M4 20V10m6 10V4m6 16v-7m5 7H2" /></Icon>,
  },
  {
    id: 'dogs',
    label: 'Cadastro',
    icon: <Icon><circle cx="7" cy="6" r="2" /><circle cx="15" cy="5" r="2" /><circle cx="18" cy="11" r="2" /><path d="M7 13c2-4 8-2 9 2 1 4-3 5-5 3-2 2-6 0-4-5Z" /></Icon>,
  },
  {
    id: 'appointments',
    label: 'Agendamento',
    icon: <Icon><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4m10-4v4M3 10h18" /></Icon>,
  },
]

export function AttendantDashboard({ onLogout, user }: AttendantDashboardProps) {
  const [activeModule, setActiveModule] = useState<AttendantModule>('dashboard')
  const [showAdmin, setShowAdmin] = useState(false)
  const [screen, setScreen] = useState<DogScreen>('list')
  const [appointmentEntry, setAppointmentEntry] = useState<AppointmentEntry>({ screen: 'list', key: 0 })
  const [selected, setSelected] = useState<Dog | null>(null)

  const { dogs, createDog, createTutor, updateDog, removeDog } = useDogs()

  function selectModule(module: AttendantModule) {
    setActiveModule(module)
    if (module === 'dogs') setScreen('list')
    if (module === 'appointments') setAppointmentEntry((prev) => ({ screen: 'list', key: prev.key + 1 }))
  }

  function openNewDog() {
    setActiveModule('dogs')
    setScreen('create')
  }

  function openNewAppointment() {
    setActiveModule('appointments')
    setAppointmentEntry((prev) => ({ screen: 'create', key: prev.key + 1 }))
  }

  async function handleCreate(data: DogFormData) {
    await createDog(data)
    setScreen('list')
  }

  async function handleEdit(data: DogFormData) {
    if (!selected) return
    await updateDog(selected.id, data)
    setScreen('list')
  }

  function openEdit(dog: Dog) {
    setSelected(dog)
    setScreen('edit')
  }

  function openDetails(dog: Dog) {
    setSelected(dog)
    setScreen('details')
  }

  async function handleRemove(dog: Dog) {
    await removeDog(dog.id)
    setScreen('list')
  }

  if (showAdmin) {
    return (
      <div className="app-shell">
        <AppHeader isAdmin={user?.isAdmin} onAdminClick={() => setShowAdmin(true)} />
        <main className="shell-width dashboard-content">
          <AdminPanel onClose={() => setShowAdmin(false)} />
        </main>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <AppHeader isAdmin={user?.isAdmin} onAdminClick={() => setShowAdmin(true)} />
      <main className="shell-width dashboard-content">
        <section className="user-row">
          <div className="profile-badge">
            <span>Perfil:</span>
            Estudante
          </div>
          <button className="logout-button" onClick={onLogout}><span>↪</span> Sair</button>
        </section>

        <nav className="attendant-nav" aria-label="Módulos do atendente">
          {NAV_ITEMS.map(({ id, label, icon }) => (
            <button
              key={id}
              className={activeModule === id ? 'active' : ''}
              onClick={() => selectModule(id)}
            >
              {icon}{label}
            </button>
          ))}
          <span>Área administrativa · Cadastro e agenda</span>
        </nav>

        {activeModule !== 'dashboard' && (
          <aside className="attendant-notice">
            <span>▣</span>
            <p><strong>Perfil Atendente:</strong> Você tem acesso ao cadastro de pets e agendamento de consultas</p>
          </aside>
        )}

        {activeModule === 'dashboard' && (
          <AttendantHome
            dogs={dogs}
            onOpenDogs={() => selectModule('dogs')}
            onOpenAppointments={() => selectModule('appointments')}
            onNewDog={openNewDog}
            onNewAppointment={openNewAppointment}
          />
        )}

        {activeModule === 'dogs' && (
          <>
            {screen === 'list' && (
              <DogList
                dogs={dogs}
                onCreate={() => setScreen('create')}
                onEdit={openEdit}
                onDetails={openDetails}
              />
            )}
            {screen === 'create' && (
              <DogForm onSave={handleCreate} onCreateTutor={createTutor} onCancel={() => setScreen('list')} />
            )}
            {screen === 'edit' && selected && (
              <DogForm dog={selected} editing onSave={handleEdit} onCreateTutor={createTutor} onCancel={() => setScreen('list')} />
            )}
            {screen === 'details' && selected && (
              <DogDetails dog={selected} onBack={() => setScreen('list')} onRemove={() => handleRemove(selected)} />
            )}
          </>
        )}

        {activeModule === 'appointments' && (
          <AppointmentsModule dogs={dogs} key={appointmentEntry.key} initialScreen={appointmentEntry.screen} />
        )}
      </main>
    </div>
  )
}
