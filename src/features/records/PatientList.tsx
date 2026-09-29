export type PatientSummary = {
  id: number
  dogName: string
  tutorName: string
  breed: string
  weight: string
  recordCount: number
  latest: { date: string; veterinarian: string } | null
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR')
}

type PatientListProps = {
  patients: PatientSummary[]
  onSelect: (patient: PatientSummary) => void
  emptyText?: string
}

export function PatientList({ patients, onSelect, emptyText = 'Nenhum prontuário encontrado.' }: PatientListProps) {
  return (
    <div className="patient-record-grid">
      {patients.map((patient) => (
        <button className="patient-record-card" key={patient.id} onClick={() => onSelect(patient)}>
          <div className="patient-card-top">
            <div>
              <h3>{patient.dogName}</h3>
              <p>Tutor: {patient.tutorName}</p>
            </div>
            <span>{patient.recordCount} atendimento(s)</span>
          </div>

          <div className="patient-clinical-flags">
            <span>{patient.breed}</span>
            <span>{patient.weight || '-'} kg</span>
          </div>

          {patient.latest ? (
            <div className="latest-record">
              <span className="record-kind-icon kind-consulta">▤</span>
              <div>
                <small>Último atendimento</small>
                <strong>Consulta</strong>
                <span>
                  {formatDate(patient.latest.date)} · {patient.latest.veterinarian}
                </span>
              </div>
            </div>
          ) : (
            <div className="latest-record">
              <small>Sem atendimentos registrados</small>
            </div>
          )}
        </button>
      ))}

      {patients.length === 0 && <div className="empty-appointments">{emptyText}</div>}
    </div>
  )
}
