import { useState } from 'react'
import { Icon } from '../../components/common/Icon'
import { AppHeader } from '../../components/layout/AppHeader'
import { AdminPanel } from '../admin/AdminPanel'
import { AppointmentsModule } from '../appointments/AppointmentsModule'
import type { Appointment } from '../appointments/appointmentTypes'
import { ClinicalCareModule } from '../consultations/ClinicalCareModule'
import { RecordsModule } from '../records/RecordsModule'
import { PrescriptionsModule } from '../prescriptions/PrescriptionsModule'
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

type AttendantModule = 'dashboard' | 'dogs' | 'appointments' | 'consultations' | 'prescriptions' | 'records'

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
  {
    id: 'consultations',
    label: 'Atendimento',
    icon: <Icon><path d="M9 3h6v4H9zM5 5h4m6 0h4v16H5V5" /><path d="M12 11v6m-3-3h6" /></Icon>,
  },
  {
    id: 'prescriptions',
    label: 'Receituário',
    icon: <Icon><path d="M7 3h7l4 4v14H7zM14 3v4h4" /><path d="M10 11h5m-5 4h3" /></Icon>,
  },
  {
    id: 'records',
    label: 'Prontuários',
    icon: <Icon><path d="M6 3h8l4 4v14H6zM14 3v5h5M9 12h6m-6 4h6" /></Icon>,
  },
]

export function AttendantDashboard({ onLogout, user }: AttendantDashboardProps) {
  const [activeModule, setActiveModule] = useState<AttendantModule>('dashboard')
  const [showAdmin, setShowAdmin] = useState(false)
  const [screen, setScreen] = useState<DogScreen>('list')
  const [appointmentEntry, setAppointmentEntry] = useState<AppointmentEntry>({ screen: 'list', key: 0 })
  const [selected, setSelected] = useState<Dog | null>(null)
  const [careAppointment, setCareAppointment] = useState<Appointment | undefined>()
  const [careKey, setCareKey] = useState(0)
  const [recordsKey, setRecordsKey] = useState(0)
  const [recordPetId, setRecordPetId] = useState<number | undefined>()

  const { dogs, createDog, createTutor, updateDog, removeDog } = useDogs()

  function selectModule(module: AttendantModule) {
    if (module === 'consultations' && activeModule !== 'consultations') {
      setCareAppointment(undefined)
      setCareKey((prev) => prev + 1)
    }
    setActiveModule(module)
    if (module === 'records') { setRecordPetId(undefined); setRecordsKey((prev) => prev + 1) }
    if (module === 'dogs') setScreen('list')
    if (module === 'appointments') setAppointmentEntry((prev) => ({ screen: 'list', key: prev.key + 1 }))
  }

  function openRecord(petId: number) {
    setRecordPetId(petId)
    setRecordsKey((prev) => prev + 1)
    setActiveModule('records')
  }

  function startCare(appointment: Appointment) {
    setCareAppointment(appointment)
    setCareKey((prev) => prev + 1)
    setActiveModule('consultations')
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
          <span>Cadastro, agenda, atendimento, receitas e prontuários</span>
        </nav>

        {activeModule !== 'dashboard' && (
          <aside className="attendant-notice">
            <span>▣</span>
            <p><strong>Perfil Estudante:</strong> Você tem acesso ao cadastro de pets, agendamentos, atendimentos, receitas e prontuários; atendimentos, receitas e correções precisam da aprovação de um professor</p>
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
          <AppointmentsModule dogs={dogs} key={appointmentEntry.key} initialScreen={appointmentEntry.screen} onStartCare={startCare} />
        )}

        {activeModule === 'consultations' && (
          <ClinicalCareModule key={careKey} dogs={dogs} initialAppointment={careAppointment} role="attendant" userEmail={user?.email} />
        )}

        {activeModule === 'prescriptions' && <PrescriptionsModule dogs={dogs} onOpenRecord={openRecord} role="attendant" />}

        {activeModule === 'records' && <RecordsModule key={recordsKey} initialPetId={recordPetId} role="attendant" />}
      </main>
    </div>
  )
}
