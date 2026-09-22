import { useState } from 'react'
import type { Appointment } from '../appointments/appointmentTypes'
import { AppHeader } from '../../components/layout/AppHeader'
import { MainNavigation } from '../../components/layout/MainNavigation'
import { AppointmentsModule } from '../appointments/AppointmentsModule'
import { ClinicalCareModule } from '../consultations/ClinicalCareModule'
import { PrescriptionsModule } from '../prescriptions/PrescriptionsModule'
import { RecordsModule } from '../records/RecordsModule'
import { ZoonosesModule } from '../zoonoses/ZoonosesModule'
import { MedicationsModule } from '../medications/MedicationsModule'
import { DashboardHome } from '../dashboard/DashboardHome'
import { DogDetails } from '../dogs/DogDetails'
import { DogForm } from '../dogs/DogForm'
import { DogList } from '../dogs/DogList'
import { useDogs } from '../../hooks/useDogs'
import type { Dog, DogFormData, DogScreen } from '../dogs/dogTypes'

type VeterinarianDashboardProps = {
  onLogout: () => void
  user: { email: string; name: string } | null
}

type AppointmentEntry = { screen: 'list' | 'create'; key: number }

export function VeterinarianDashboard({ onLogout, user }: VeterinarianDashboardProps) {
  const [activeModule, setActiveModule] = useState('dashboard')
  const [screen, setScreen] = useState<DogScreen>('list')
  const [selected, setSelected] = useState<Dog | null>(null)
  const [careAppointment, setCareAppointment] = useState<Appointment | undefined>()
  const [recordPetId, setRecordPetId] = useState<number | undefined>()
  const [appointmentEntry, setAppointmentEntry] = useState<AppointmentEntry>({ screen: 'list', key: 0 })

  const { dogs, createDog, createTutor, updateDog, removeDog } = useDogs()

  function openModule(module: string) {
    if (module === 'consultations' && activeModule !== 'consultations') setCareAppointment(undefined)
    if (module === 'records') setRecordPetId(undefined)
    if (module === 'dogs') setScreen('list')
    if (module === 'appointments') setAppointmentEntry((prev) => ({ screen: 'list', key: prev.key + 1 }))
    setActiveModule(module)
  }

  function openNewDog() {
    setActiveModule('dogs')
    setScreen('create')
  }

  function openNewAppointment() {
    setActiveModule('appointments')
    setAppointmentEntry((prev) => ({ screen: 'create', key: prev.key + 1 }))
  }

  function startCare(appointment: Appointment) {
    setCareAppointment(appointment)
    setActiveModule('consultations')
  }

  function openRecord(petId: number) {
    setRecordPetId(petId)
    setActiveModule('records')
  }

  function openEdit(dog: Dog) {
    setSelected(dog)
    setScreen('edit')
  }

  function openDetails(dog: Dog) {
    setSelected(dog)
    setScreen('details')
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

  async function handleRemove(dog: Dog) {
    await removeDog(dog.id)
    setScreen('list')
  }

  return (
    <div className="app-shell">
      <AppHeader />
      <main className="shell-width dashboard-content">
        <section className="user-row">
          <div>
            <p>Veterinário(a) logado:</p>
            <strong>{user?.name || user?.email || '—'}</strong>
            {user?.name && (
              <small style={{ display: 'block', opacity: 0.7, fontWeight: 400 }}>{user.email}</small>
            )}
          </div>
          <div className="profile-badge"><span>Perfil:</span>Médico Veterinário</div>
          <button className="logout-button" onClick={onLogout}><span>↪</span> Sair</button>
        </section>

        <MainNavigation activeModule={activeModule} onSelect={openModule} />

        {activeModule === 'dashboard' && (
          <DashboardHome dogs={dogs} onOpenModule={openModule} onNewDog={openNewDog} onNewAppointment={openNewAppointment} />
        )}

        {activeModule === 'dogs' && (
          <>
            <aside className="profile-notice">
              <span>♧</span>
              <p><strong>Perfil Veterinário:</strong> Acesso completo a todos os módulos do sistema</p>
            </aside>
            {screen === 'list' && (
              <DogList dogs={dogs} onCreate={() => setScreen('create')} onEdit={openEdit} onDetails={openDetails} />
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
          <AppointmentsModule
            dogs={dogs}
            key={appointmentEntry.key}
            initialScreen={appointmentEntry.screen}
            onStartCare={startCare}
          />
        )}
        {activeModule === 'consultations' && <ClinicalCareModule dogs={dogs} initialAppointment={careAppointment} />}
        {activeModule === 'prescriptions' && <PrescriptionsModule dogs={dogs} onOpenRecord={openRecord} />}
        {activeModule === 'records' && <RecordsModule initialPetId={recordPetId} />}
        {activeModule === 'zoonoses' && <ZoonosesModule />}
        {activeModule === 'medications' && <MedicationsModule />}
      </main>
    </div>
  )
}
