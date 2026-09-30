import type { ReactNode } from 'react'
import { Icon } from '../../components/common/Icon'
import { useDogs } from '../dogs/useDogs'
import { AppointmentsModule } from '../appointments/AppointmentsModule'
import { ClinicalCareModule } from '../consultations/ClinicalCareModule'
import { DashboardShell, type DashboardUser } from '../dashboard/DashboardShell'
import { useDashboardNavigation, type DashboardModule } from '../dashboard/useDashboardNavigation'
import { DogsModule } from '../dogs/DogsModule'
import { PrescriptionsModule } from '../prescriptions/PrescriptionsModule'
import { RecordsModule } from '../records/RecordsModule'
import { AttendantHome } from './AttendantHome'

type AttendantDashboardProps = {
  onLogout: () => void
  user: DashboardUser
}

const NAV_ITEMS: { id: DashboardModule; label: string; icon: ReactNode }[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <Icon>
        <path d="M4 20V10m6 10V4m6 16v-7m5 7H2" />
      </Icon>
    ),
  },
  {
    id: 'dogs',
    label: 'Cadastro',
    icon: (
      <Icon>
        <circle cx="7" cy="6" r="2" />
        <circle cx="15" cy="5" r="2" />
        <circle cx="18" cy="11" r="2" />
        <path d="M7 13c2-4 8-2 9 2 1 4-3 5-5 3-2 2-6 0-4-5Z" />
      </Icon>
    ),
  },
  {
    id: 'appointments',
    label: 'Agendamento',
    icon: (
      <Icon>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v4m10-4v4M3 10h18" />
      </Icon>
    ),
  },
  {
    id: 'consultations',
    label: 'Atendimento',
    icon: (
      <Icon>
        <path d="M9 3h6v4H9zM5 5h4m6 0h4v16H5V5" />
        <path d="M12 11v6m-3-3h6" />
      </Icon>
    ),
  },
  {
    id: 'prescriptions',
    label: 'Receituário',
    icon: (
      <Icon>
        <path d="M7 3h7l4 4v14H7zM14 3v4h4" />
        <path d="M10 11h5m-5 4h3" />
      </Icon>
    ),
  },
  {
    id: 'records',
    label: 'Prontuários',
    icon: (
      <Icon>
        <path d="M6 3h8l4 4v14H6zM14 3v5h5M9 12h6m-6 4h6" />
      </Icon>
    ),
  },
]

export function AttendantDashboard({ onLogout, user }: AttendantDashboardProps) {
  const nav = useDashboardNavigation()
  const dogsApi = useDogs()
  const { dogs } = dogsApi

  return (
    <DashboardShell user={user} profileLabel="Estudante" onLogout={onLogout}>
      <nav className="attendant-nav" aria-label="Módulos do atendente">
        {NAV_ITEMS.map(({ id, label, icon }) => (
          <button key={id} className={nav.activeModule === id ? 'active' : ''} onClick={() => nav.selectModule(id)}>
            {icon}
            {label}
          </button>
        ))}
        <span>Cadastro, agenda, atendimento, receitas e prontuários</span>
      </nav>

      {nav.activeModule !== 'dashboard' && (
        <aside className="attendant-notice">
          <span>▣</span>
          <p>
            <strong>Perfil Estudante:</strong> Você tem acesso ao cadastro de pets, agendamentos, atendimentos, receitas
            e prontuários; atendimentos, receitas e correções precisam da aprovação de um professor
          </p>
        </aside>
      )}

      {nav.activeModule === 'dashboard' && (
        <AttendantHome
          dogs={dogs}
          onOpenDogs={() => nav.selectModule('dogs')}
          onOpenAppointments={() => nav.selectModule('appointments')}
          onNewDog={nav.openNewDog}
          onNewAppointment={nav.openNewAppointment}
        />
      )}
      {nav.activeModule === 'dogs' && (
        <DogsModule key={nav.dogsEntry.key} dogsApi={dogsApi} initialScreen={nav.dogsEntry.screen} />
      )}
      {nav.activeModule === 'appointments' && (
        <AppointmentsModule
          dogs={dogs}
          key={nav.appointmentEntry.key}
          initialScreen={nav.appointmentEntry.screen}
          onStartCare={nav.startCare}
        />
      )}
      {nav.activeModule === 'consultations' && (
        <ClinicalCareModule
          key={nav.careEntry.key}
          dogs={dogs}
          initialAppointment={nav.careEntry.screen}
          role="attendant"
          userEmail={user?.email}
          onOpenRecord={nav.openRecord}
        />
      )}
      {nav.activeModule === 'prescriptions' && (
        <PrescriptionsModule dogs={dogs} onOpenRecord={nav.openRecord} role="attendant" />
      )}
      {nav.activeModule === 'records' && (
        <RecordsModule
          key={nav.recordsEntry.key}
          initialPetId={nav.recordsEntry.screen}
          role="attendant"
          userEmail={user?.email}
        />
      )}
    </DashboardShell>
  )
}
