import { MainNavigation } from '../../components/layout/MainNavigation'
import { useDogs } from '../dogs/useDogs'
import { AppointmentsModule } from '../appointments/AppointmentsModule'
import { ClinicalCareModule } from '../consultations/ClinicalCareModule'
import { DashboardHome } from '../dashboard/DashboardHome'
import { DashboardShell, type DashboardUser } from '../dashboard/DashboardShell'
import { useDashboardNavigation, type DashboardModule } from '../dashboard/useDashboardNavigation'
import { DogsModule } from '../dogs/DogsModule'
import { MedicationsModule } from '../medications/MedicationsModule'
import { PrescriptionsModule } from '../prescriptions/PrescriptionsModule'
import { RecordsModule } from '../records/RecordsModule'
import { SupervisionRequestsBell } from '../supervision/bell/SupervisionRequestsBell'
import { ZoonosesModule } from '../zoonoses/ZoonosesModule'

type VeterinarianDashboardProps = {
  onLogout: () => void
  user: DashboardUser
}

const VET_NOTICE = (
  <aside className="profile-notice">
    <span>♧</span>
    <p>
      <strong>Perfil Veterinário:</strong> Acesso completo a todos os módulos do sistema
    </p>
  </aside>
)

export function VeterinarianDashboard({ onLogout, user }: VeterinarianDashboardProps) {
  const nav = useDashboardNavigation()
  const dogsApi = useDogs()
  const { dogs } = dogsApi
  const openModule = (module: string) => nav.selectModule(module as DashboardModule)

  return (
    <DashboardShell
      user={user}
      profileLabel="Médico Veterinário"
      onLogout={onLogout}
      headerActions={<SupervisionRequestsBell />}
    >
      <MainNavigation activeModule={nav.activeModule} onSelect={openModule} />

      {nav.activeModule === 'dashboard' && (
        <DashboardHome
          dogs={dogs}
          onOpenModule={openModule}
          onNewDog={nav.openNewDog}
          onNewAppointment={nav.openNewAppointment}
        />
      )}
      {nav.activeModule === 'dogs' && (
        <DogsModule
          key={nav.dogsEntry.key}
          dogsApi={dogsApi}
          initialScreen={nav.dogsEntry.screen}
          notice={VET_NOTICE}
        />
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
          role="veterinarian"
          userEmail={user?.email}
          onOpenRecord={nav.openRecord}
        />
      )}
      {nav.activeModule === 'prescriptions' && <PrescriptionsModule dogs={dogs} onOpenRecord={nav.openRecord} />}
      {nav.activeModule === 'records' && (
        <RecordsModule
          key={nav.recordsEntry.key}
          initialPetId={nav.recordsEntry.screen}
          role="veterinarian"
          userEmail={user?.email}
        />
      )}
      {nav.activeModule === 'zoonoses' && <ZoonosesModule />}
      {nav.activeModule === 'medications' && <MedicationsModule />}
    </DashboardShell>
  )
}
