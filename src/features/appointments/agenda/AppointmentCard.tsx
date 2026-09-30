import { Icon } from '../../../components/common/Icon'
import type { Appointment, AppointmentStatus } from '../appointmentTypes'
import { STATUS_LABELS, formatAgendaDate } from './agendaFilters'
import type { AgendaDialog } from './AgendaDialogs'

const CLOSED_STATUSES: AppointmentStatus[] = ['completed', 'cancelled', 'no-show']

type AppointmentCardProps = {
  appointment: Appointment
  expanded: boolean
  onToggle: () => void
  onStartCare?: (appointment: Appointment) => void
  onStatusChange: (status: AppointmentStatus) => void
  onOpenDialog: (kind: AgendaDialog['kind']) => void
}

export function AppointmentCard({
  appointment,
  expanded,
  onToggle,
  onStartCare,
  onStatusChange,
  onOpenDialog,
}: AppointmentCardProps) {
  return (
    <article className={`appointment-card status-${appointment.status}${expanded ? ' expanded' : ''}`}>
      <button className="appointment-card-summary" type="button" aria-expanded={expanded} onClick={onToggle}>
        <div>
          <div className="appointment-name-row">
            <strong>{appointment.dogName}</strong>
            <span className={`status-badge status-${appointment.status}`}>{STATUS_LABELS[appointment.status]}</span>
          </div>
          <p>Tutor: {appointment.tutorName}</p>
          <div className="appointment-meta">
            <span>▣ {formatAgendaDate(appointment.date)}</span>
            <span>◷ {appointment.time || 'Horário não informado'}</span>
          </div>
        </div>
        <div className="appointment-card-side">
          <span className="service-label">{appointment.serviceType}</span>
          <span className="appointment-chevron">
            <Icon>
              <path d="m7 10 5 5 5-5" />
            </Icon>
          </span>
        </div>
      </button>
      {onStartCare && !CLOSED_STATUSES.includes(appointment.status) && (
        <div className="appointment-care-action">
          <button type="button" className="primary-button" onClick={() => onStartCare(appointment)}>
            Ir para atendimento
          </button>
        </div>
      )}
      {expanded && (
        <div className="appointment-details">
          <div>
            <span>Veterinário</span>
            <strong>{appointment.veterinarian || 'Não informado'}</strong>
          </div>
          <div>
            <span>Tipo</span>
            <strong>Horário marcado</strong>
          </div>
          <div>
            <span>Observações</span>
            <strong>{appointment.notes || 'Nenhuma observação'}</strong>
          </div>
          {appointment.cancellationReason && (
            <div className="appointment-notes">
              <span>Motivo do cancelamento</span>
              <strong>{appointment.cancellationReason}</strong>
            </div>
          )}
          <div className="appointment-actions appointment-notes">
            <select
              aria-label="Alterar situação"
              value={appointment.status}
              onChange={(event) => onStatusChange(event.target.value as AppointmentStatus)}
            >
              {Object.entries(STATUS_LABELS)
                .filter(([value]) => value !== 'cancelled')
                .map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              {appointment.status === 'cancelled' && <option value="cancelled">Cancelado</option>}
            </select>
            <button onClick={() => onOpenDialog('reschedule')}>Remarcar</button>
            <button onClick={() => onOpenDialog('reminder')}>Criar lembrete</button>
            <button
              className="danger-action"
              disabled={appointment.status === 'cancelled'}
              onClick={() => onOpenDialog('cancel')}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </article>
  )
}
