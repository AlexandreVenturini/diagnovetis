import { useState } from 'react'
import { Icon } from '../../components/common/Icon'
import { AppHeader } from '../../components/layout/AppHeader'
import { AppointmentsModule } from '../appointments/AppointmentsModule'
import { DogDetails } from '../dogs/DogDetails'
import { DogForm } from '../dogs/DogForm'
import { DogList } from '../dogs/DogList'
import { useDogs } from '../../hooks/useDogs'
import type { Dog, DogFormData, DogScreen } from '../dogs/dogTypes'

type AttendantDashboardProps = { onLogout: () => void }
type AttendantModule = 'dogs' | 'appointments'

export function AttendantDashboard({ onLogout }: AttendantDashboardProps) {
  const [activeModule, setActiveModule] = useState<AttendantModule>('dogs')
  const [screen, setScreen] = useState<DogScreen>('list')
  const [selected, setSelected] = useState<Dog | null>(null)
  const { dogs, createDog, updateDog, removeDog } = useDogs()

  async function handleCreate(data: DogFormData) { await createDog(data); setScreen('list') }
  async function handleEdit(data: DogFormData) { if (!selected) return; await updateDog(selected.id, data); setScreen('list') }
  function selectModule(module: AttendantModule) { setActiveModule(module); if (module === 'dogs') setScreen('list') }

  return <div className="app-shell"><AppHeader /><main className="shell-width dashboard-content">
    <section className="user-row"><div><p>Atendente logado:</p><strong>atendente@ifes.edu.br</strong></div><div className="profile-badge"><span>Perfil:</span>Atendente</div><button className="logout-button" onClick={onLogout}><span>↪</span> Sair</button></section>
    <nav className="attendant-nav" aria-label="Módulos do atendente"><button className={activeModule === 'dogs' ? 'active' : ''} onClick={() => selectModule('dogs')}><Icon><circle cx="7" cy="6" r="2" /><circle cx="15" cy="5" r="2" /><circle cx="18" cy="11" r="2" /><path d="M7 13c2-4 8-2 9 2 1 4-3 5-5 3-2 2-6 0-4-5Z" /></Icon>Cadastro</button><button className={activeModule === 'appointments' ? 'active' : ''} onClick={() => selectModule('appointments')}><Icon><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4m10-4v4M3 10h18" /></Icon>Agendamento</button><span>⚠ Módulos clínicos disponíveis apenas para veterinários</span></nav>
    <aside className="attendant-notice"><span>▣</span><p><strong>Perfil Atendente:</strong> Você tem acesso ao cadastro de pets e agendamento de consultas</p></aside>
    {activeModule === 'dogs' && <>{screen === 'list' && <DogList dogs={dogs} onCreate={() => setScreen('create')} onEdit={(dog) => { setSelected(dog); setScreen('edit') }} onDetails={(dog) => { setSelected(dog); setScreen('details') }} />}{screen === 'create' && <DogForm onSave={handleCreate} onCancel={() => setScreen('list')} />}{screen === 'edit' && selected && <DogForm dog={selected} editing onSave={handleEdit} onCancel={() => setScreen('list')} />}{screen === 'details' && selected && <DogDetails dog={selected} onBack={() => setScreen('list')} onRemove={async () => { await removeDog(selected.id); setScreen('list') }} />}</>}
    {activeModule === 'appointments' && <AppointmentsModule />}
  </main></div>
}
