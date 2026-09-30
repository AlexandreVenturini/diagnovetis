import type { IssuedPrescription } from '../../../services/PrescriptionService'
import { periodNoun, type PeriodView } from '../../common/period'

type PrescriptionHistoryProps = {
  rows: IssuedPrescription[]
  view: PeriodView
  searching: boolean
  onSelect: (row: IssuedPrescription) => void
}

export function PrescriptionHistory({ rows, view, searching, onSelect }: PrescriptionHistoryProps) {
  return (
    <>
      <div className="agenda-list-heading">
        <h3>{searching ? 'Resultado da busca' : `Receitas ${periodNoun(view)}`}</h3>
        <span>{rows.length} resultado(s)</span>
      </div>
      <div className="rx-history">
        {!rows.length && <p>Nenhuma receita encontrada neste período com os filtros selecionados.</p>}
        {rows.map((row) => (
          <article className="content-card" key={row.id}>
            <h3>{row.snapshot.patient.dogName}</h3>
            <p>Tutor: {row.snapshot.patient.tutorName}</p>
            <p>
              {new Date(row.snapshot.issuedAt).toLocaleDateString('pt-BR')} · {row.snapshot.patient.veterinarian}
            </p>
            <p>{row.snapshot.prescription.items.map((item) => item.medication).join(', ')}</p>
            <button className="outline-button" onClick={() => onSelect(row)}>
              Ver detalhes
            </button>
          </article>
        ))}
      </div>
    </>
  )
}
