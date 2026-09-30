import { generateConsultationReport } from './consultationReport'
import type { ConsultationData } from './consultationTypes'
import type { ExamDraft } from './examTypes'

export type CompletedCare = { data: ConsultationData; exams: ExamDraft[]; id: number; petId?: number }

type CareCompletedProps = {
  completed: CompletedCare
  message: string
  onMessage: (message: string) => void
  onNew: () => void
  newDisabled: boolean
  onOpenRecord?: (petId: number) => void
}

export function CareCompleted({ completed, message, onMessage, onNew, newDisabled, onOpenRecord }: CareCompletedProps) {
  const { petId } = completed
  return (
    <section className="consultation-panel content-card">
      <h2>Atendimento finalizado</h2>
      <p>
        Atendimento nº {completed.id} de <strong>{completed.data.dogName}</strong> salvo no prontuário.
      </p>
      {completed.data.dischargeCondition === 'Óbito' ? (
        <aside className="profile-notice profile-notice--death">
          <span>✝</span>
          <p>
            <strong>Condição na alta: óbito.</strong> Registre o óbito completo no prontuário do animal: data e hora,
            circunstâncias, causa provável, eutanásia, necropsia e destinação do corpo.
            {onOpenRecord && petId !== undefined && (
              <>
                {' '}
                <button type="button" className="text-back-button" onClick={() => onOpenRecord(petId)}>
                  Abrir prontuário para registrar o óbito →
                </button>
              </>
            )}
          </p>
        </aside>
      ) : (
        <p>Para emitir uma receita, acesse a aba Receituário.</p>
      )}
      <div className="form-actions">
        <button
          className="secondary-button"
          onClick={() =>
            onMessage(
              generateConsultationReport(completed.data, completed.exams)
                ? 'Relatório clínico aberto.'
                : 'O navegador bloqueou o relatório. Permita novas janelas e tente novamente.',
            )
          }
        >
          Gerar relatório clínico
        </button>
        <button className="secondary-button" disabled={newDisabled} onClick={onNew}>
          Novo atendimento
        </button>
      </div>
      {message && (
        <p className="consultation-message" role="status">
          {message}
        </p>
      )}
    </section>
  )
}
