import { useMemo, useState } from 'react'
import type { UserRole } from '../auth/profile'
import { usePeriod } from '../common/usePeriod'
import { useRangeData } from '../common/useRangeData'
import { periodRange } from '../common/period'
import type { PatientSummary } from './PatientList'
import { PatientListScreen } from './PatientListScreen'
import { PatientDetails } from './details/PatientDetails'
import { RetificationEditor } from './retification/RetificationEditor'
import { DeathForm } from './death/DeathForm'
import { summarizePatients, type SummaryItem } from './patientSummaries'
import { fetchSummaries } from './recordData'
import { usePatientRecord } from './usePatientRecord'

type Screen = 'list' | 'details' | 'retify' | 'death'

type RecordsModuleProps = {
  initialPetId?: number
  role?: UserRole
  userEmail?: string
}

export function RecordsModule({ initialPetId, role = 'veterinarian', userEmail }: RecordsModuleProps) {
  const [screen, setScreen] = useState<Screen>(initialPetId ? 'details' : 'list')
  const [selectedId, setSelectedId] = useState<number | null>(initialPetId ?? null)
  const [query, setQuery] = useState('')
  const [period, setPeriod] = usePeriod('prontuarios')
  const [retifyId, setRetifyId] = useState<number | null>(null)
  const [detailsNotice, setDetailsNotice] = useState('')
  const [detailsKey, setDetailsKey] = useState(0)
  const patientRecord = usePatientRecord(initialPetId)
  const selected = patientRecord.patient

  const range = query.trim() ? null : periodRange(period)
  const summaries = useRangeData(fetchSummaries, (item: SummaryItem) => item.key, range)
  const patients = useMemo(() => summarizePatients(summaries.items, query, range), [summaries.items, query, range])

  function openPatient(patient: PatientSummary) {
    setRetifyId(null)
    setDetailsNotice('')
    patientRecord.clear()
    setSelectedId(patient.id)
    setScreen('details')
    void patientRecord.load(patient.id)
  }

  function openRetification(recordId: number) {
    setRetifyId(recordId)
    setDetailsNotice('')
    setScreen('retify')
  }

  function openDeathForm() {
    setDetailsNotice('')
    setScreen('death')
  }

  async function returnToDetails(message: string) {
    if (selectedId !== null) await patientRecord.load(selectedId)
    void summaries.refresh().catch(() => {})
    setDetailsNotice(message)
    setDetailsKey((prev) => prev + 1)
    setScreen('details')
  }

  if (screen === 'list')
    return (
      <PatientListScreen
        role={role}
        patients={patients}
        loading={summaries.loading}
        error={summaries.error}
        period={period}
        onPeriodChange={setPeriod}
        query={query}
        onQueryChange={setQuery}
        onSelect={openPatient}
      />
    )

  if (patientRecord.loading)
    return (
      <section className="records-module">
        <div className="empty-appointments">Carregando prontuário...</div>
      </section>
    )

  if (!selected)
    return (
      <section className="records-module">
        <div className="empty-appointments">{patientRecord.error || 'Paciente não encontrado.'}</div>
        <button className="text-back-button" onClick={() => setScreen('list')}>
          ‹ Prontuários
        </button>
      </section>
    )

  if (screen === 'death')
    return (
      <DeathForm
        petId={selected.id}
        dogName={selected.dogName}
        role={role}
        userEmail={userEmail}
        records={selected.records}
        existing={selected.death}
        onDone={(message) => void returnToDetails(message)}
        onCancel={() => setScreen('details')}
      />
    )

  if (screen === 'retify' && retifyId !== null)
    return (
      <RetificationEditor
        consultaId={retifyId}
        role={role}
        onDone={(message) => void returnToDetails(message)}
        onCancel={() => setScreen('details')}
      />
    )

  return (
    <PatientDetails
      key={detailsKey}
      selected={selected}
      onBack={() => {
        setDetailsNotice('')
        setScreen('list')
      }}
      onExamSaved={patientRecord.replaceExam}
      onRetify={openRetification}
      onRegisterDeath={openDeathForm}
      onRetifyDeath={openDeathForm}
      canEditExams={role === 'veterinarian'}
      canRetifyDeath={role === 'veterinarian'}
      initialRecordId={retifyId ?? undefined}
      initialNotice={detailsNotice}
    />
  )
}
