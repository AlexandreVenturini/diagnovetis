import { useRef, useState } from 'react'
import { RecordVersions } from './RecordVersions'
import { RecordSelector } from './RecordSelector'
import { AnimalRecordForm } from './AnimalRecordForm'
import { DeathSection } from '../death/DeathSection'
import { PatientPrescriptions } from '../../prescriptions/PatientPrescriptions'
import { exportPatientRecord } from '../recordReport'
import type { ClinicalRecord, PatientRecord } from '../recordTypes'
import type { Exame } from '../../../models/Exame'

const EMPTY_RECORD: ClinicalRecord = {
  id: 0,
  date: '',
  veterinarian: '',
  crmv: '',
  students: [],
  description: '',
  diagnosis: '',
  conduct: '',
  validatedBy: '',
}

type PatientDetailsProps = {
  selected: PatientRecord
  onBack: () => void
  onExamSaved: (exam: Exame) => void
  onRetify: (recordId: number) => void
  onRegisterDeath: () => void
  onRetifyDeath: () => void
  canEditExams: boolean
  canRetifyDeath: boolean
  initialRecordId?: number
  initialNotice?: string
}

export function PatientDetails({
  selected,
  onBack,
  onExamSaved,
  onRetify,
  onRegisterDeath,
  onRetifyDeath,
  canEditExams,
  canRetifyDeath,
  initialRecordId,
  initialNotice = '',
}: PatientDetailsProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [notice, setNotice] = useState(initialNotice)
  const [showVersions, setShowVersions] = useState(false)
  const sortedRecords = [...selected.records].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
  const [recordId, setRecordId] = useState<number | undefined>(initialRecordId ?? sortedRecords[0]?.id)
  const currentRecord = sortedRecords.find((record) => record.id === recordId) ?? sortedRecords[0]

  function exportPdf() {
    const opened = formRef.current ? exportPatientRecord(formRef.current, selected.dogName) : false
    setNotice(
      opened ? 'Relatório aberto para impressão ou salvamento em PDF.' : 'O navegador bloqueou a janela do relatório.',
    )
  }

  return (
    <section className="record-details-module">
      <div className="records-heading record-detail-heading">
        <div>
          <button className="text-back-button" onClick={onBack}>
            ‹ Prontuários
          </button>
          <h2>
            {selected.dogName}
            {selected.death && (
              <span className="pill pill--dark record-death-pill">
                Óbito em {new Date(selected.death.dataHora).toLocaleDateString('pt-BR')}
              </span>
            )}
          </h2>
          <p>
            Tutor: {selected.tutorName} · {selected.breed} · {selected.age}
          </p>
        </div>
        <div className="record-header-actions">
          <button className="outline-button" onClick={exportPdf}>
            ⇩ Exportar PDF
          </button>
          {!selected.death && (
            <button className="secondary-button" onClick={onRegisterDeath}>
              Registrar óbito
            </button>
          )}
        </div>
      </div>

      {notice && (
        <p className="record-notice" role="status">
          {notice}
        </p>
      )}

      <RecordSelector
        records={sortedRecords}
        current={currentRecord}
        onSelect={(id) => {
          setRecordId(id)
          setShowVersions(false)
        }}
        showVersions={showVersions}
        onToggleVersions={() => setShowVersions((value) => !value)}
        onRetify={onRetify}
      />

      {showVersions && currentRecord && (
        <RecordVersions consultaId={currentRecord.id} onClose={() => setShowVersions(false)} />
      )}

      {selected.death && <DeathSection death={selected.death} canRetify={canRetifyDeath} onRetify={onRetifyDeath} />}

      <PatientPrescriptions petId={selected.id} />

      <AnimalRecordForm
        ref={formRef}
        patient={selected}
        record={currentRecord ?? EMPTY_RECORD}
        canEditExams={canEditExams}
        onExamSaved={onExamSaved}
      />
    </section>
  )
}
