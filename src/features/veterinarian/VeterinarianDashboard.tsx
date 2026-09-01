import { useState } from 'react'
import { AppHeader } from '../../components/layout/AppHeader'
import { MainNavigation } from '../../components/layout/MainNavigation'
import { AppointmentsModule } from '../appointments/AppointmentsModule'
import { ClinicalCareModule } from '../consultations/ClinicalCareModule'
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
}

export function VeterinarianDashboard({ onLogout }: VeterinarianDashboardProps) {
  const [activeModule, setActiveModule] = useState('dashboard')
  const [screen, setScreen] = useState<DogScreen>('list')
  const [appointmentEntry, setAppointmentEntry] = useState<{ screen: 'list' | 'create'; key: number }>({ screen: 'list', key: 0 })
  const [selected, setSelected] = useState<Dog | null>(null)

  const { dogs, createDog, updateDog, removeDog } = useDogs()

  function handleCreate(data: DogFormData) {
    createDog(data)
    setScreen('list')
  }

  function handleEdit(data: DogFormData) {
    if (!selected) return
    updateDog(selected.id, data)
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

  function handleRemove(dog: Dog) {
    removeDog(dog.id)
    setScreen('list')
  }

  function openModule(module: string) {
    setActiveModule(module)
    if (module === 'dogs') setScreen('list')
    if (module === 'appointments') setAppointmentEntry((current) => ({ screen: 'list', key: current.key + 1 }))
  }

  function openNewDog() { setScreen('create'); setActiveModule('dogs') }
  function openNewAppointment() { setAppointmentEntry((current) => ({ screen: 'create', key: current.key + 1 })); setActiveModule('appointments') }

  return (
    <div className="app-shell">
      <AppHeader />
      <main className="shell-width dashboard-content">
        <section className="user-row">
          <div><p>Veterinário(a) logado:</p><strong>veterinario@ifes.edu.br</strong></div>
          <div className="profile-badge"><span>Perfil:</span>Médico Veterinário</div>
          <button className="logout-button" onClick={onLogout}><span>↪</span> Sair</button>
        </section>

        <MainNavigation activeModule={activeModule} onSelect={openModule} />

        {activeModule === 'dashboard' && <DashboardHome dogs={dogs} onOpenModule={openModule} onNewDog={openNewDog} onNewAppointment={openNewAppointment} />}

        {activeModule === 'dogs' && <aside className="profile-notice">
          <span>♧</span>
          <p><strong>Perfil Veterinário:</strong> Acesso completo a todos os módulos do sistema</p>
        </aside>}

        {activeModule === 'dogs' && <>
          {screen === 'list' && <DogList dogs={dogs} onCreate={() => setScreen('create')} onEdit={openEdit} onDetails={openDetails} />}
          {screen === 'create' && <DogForm onSave={handleCreate} onCancel={() => setScreen('list')} />}
          {screen === 'edit' && selected && <DogForm dog={selected} editing onSave={handleEdit} onCancel={() => setScreen('list')} />}
          {screen === 'details' && selected && <DogDetails dog={selected} onBack={() => setScreen('list')} onRemove={() => handleRemove(selected)} />}
        </>}
        {activeModule === 'appointments' && <AppointmentsModule dogs={dogs} key={appointmentEntry.key} initialScreen={appointmentEntry.screen} />}
        {activeModule === 'consultations' && <ClinicalCareModule dogs={dogs} />}
        {activeModule === 'records' && <RecordsModule />}
        {activeModule === 'zoonoses' && <ZoonosesModule />}
        {activeModule === 'medications' && <MedicationsModule />}
      </main>
    </div>
  )
}
