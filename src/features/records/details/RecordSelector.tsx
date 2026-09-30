import type { ClinicalRecord } from '../recordTypes'
import { formatRecordDate } from './formatRecordDate'

type RecordSelectorProps = {
  records: ClinicalRecord[]
  current: ClinicalRecord | undefined
  onSelect: (recordId: number) => void
  showVersions: boolean
  onToggleVersions: () => void
  onRetify: (recordId: number) => void
}

const isRetified = (record: ClinicalRecord) => (record.versao ?? 1) > 1

function RetifiedNote({ record }: { record: ClinicalRecord }) {
  return (
    <small className="record-selector-retified">
      Retificado{record.retificadoPorNome ? ` por ${record.retificadoPorNome}` : ''}
      {record.retificadoEm ? ` em ${record.retificadoEm.toLocaleDateString('pt-BR')}` : ''} · versão {record.versao}
    </small>
  )
}

export function RecordSelector({
  records,
  current,
  onSelect,
  showVersions,
  onToggleVersions,
  onRetify,
}: RecordSelectorProps) {
  if (records.length === 0)
    return (
      <section className="content-card record-selector">
        <p className="record-selector-empty">Nenhum atendimento registrado para este paciente.</p>
      </section>
    )

  return (
    <section className="content-card record-selector">
      <label className="record-selector-field">
        Atendimento exibido no prontuário
        <select value={current?.id ?? ''} onChange={(event) => onSelect(Number(event.target.value))}>
          {records.map((record) => (
            <option key={record.id} value={record.id}>
              Nº {record.id} · {formatRecordDate(record.date)} · {record.veterinarian}
              {isRetified(record) ? ' · retificado' : ''}
            </option>
          ))}
        </select>
        {current && isRetified(current) && <RetifiedNote record={current} />}
      </label>
      {current && (
        <div className="record-selector-actions">
          <button className="outline-button" type="button" onClick={onToggleVersions}>
            {showVersions ? 'Ocultar histórico' : 'Histórico de retificações'}
          </button>
          <button className="primary-button" type="button" onClick={() => onRetify(current.id)}>
            Editar/Retificar atendimento
          </button>
        </div>
      )}
    </section>
  )
}
