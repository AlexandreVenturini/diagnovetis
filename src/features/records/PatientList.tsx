import type { PatientRecord, RecordKind } from './recordTypes'

const KIND_ICONS: Record<RecordKind, string> = {
  Consulta: '▤',
  Vacina: '+',
  Exame: '⚗',
  Tratamento: '∿',
  Retorno: '↻',
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR')
}

type PatientListProps = {
  patients: PatientRecord[]
  onSelect: (patient: PatientRecord) => void
}

export function PatientList({ patients, onSelect }: PatientListProps) {
  return (
    <div className="patient-record-grid">
      {patients.map((patient) => {
        const latest = [...patient.records].sort((a, b) => b.date.localeCompare(a.date))[0]
        const pending = patient.records.filter((r) => r.validation === 'pending').length

        return (
          <button className="patient-record-card" key={patient.id} onClick={() => onSelect(patient)}>
            <div className="patient-card-top">
              <div>
                <h3>{patient.dogName}</h3>
                <p>Tutor: {patient.tutorName}</p>
              </div>
              <span>{patient.records.length} registros</span>
            </div>

            <div className="patient-clinical-flags">
              <span>{patient.breed}</span>
              <span>{patient.weights.at(-1)?.weight ?? '-'} kg</span>
              {patient.allergies.length > 0 && (
                <span className="alert-flag">{patient.allergies.length} alergia(s)</span>
              )}
            </div>

            {latest ? (
              <div className="latest-record">
                <span className={`record-kind-icon kind-${latest.kind.toLowerCase()}`}>
                  {KIND_ICONS[latest.kind]}
                </span>
                <div>
                  <small>Último atendimento</small>
                  <strong>{latest.kind}</strong>
                  <span>{formatDate(latest.date)} · {latest.veterinarian}</span>
                </div>
              </div>
            ) : (
              <div className="latest-record">
                <small>Sem atendimentos registrados</small>
              </div>
            )}

            {pending > 0 && (
              <span className="pending-records">{pending} aguardando validação</span>
            )}
          </button>
        )
      })}

      {patients.length === 0 && (
        <div className="empty-appointments">Nenhum prontuário encontrado.</div>
      )}
    </div>
  )
}
