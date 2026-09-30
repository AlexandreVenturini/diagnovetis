import { useState } from 'react'
import type { ReactNode } from 'react'
import type { Appointment, AppointmentReminder, ReminderType } from '../appointmentTypes'

export type AgendaDialog = { kind: 'reschedule' | 'cancel' | 'reminder'; appointment: Appointment }

type AgendaDialogsProps = {
  dialog: AgendaDialog
  onClose: () => void
  hasConflict: (appointment: Appointment, date: string, time: string) => Promise<boolean>
  onReschedule: (appointment: Appointment, date: string, time: string) => void
  onCancelAppointment: (appointment: Appointment, reason: string) => void
  onAddReminder: (appointment: Appointment, reminder: AppointmentReminder) => void
}

function AgendaModal({
  title,
  error,
  children,
  actions,
}: {
  title: string
  error: string
  children: ReactNode
  actions: ReactNode
}) {
  return (
    <div className="agenda-modal-backdrop" role="presentation">
      <section className="agenda-modal" role="dialog" aria-modal="true" aria-labelledby="agenda-dialog-title">
        <h3 id="agenda-dialog-title">{title}</h3>
        {children}
        {error && <p className="dialog-error">{error}</p>}
        <div className="modal-actions">{actions}</div>
      </section>
    </div>
  )
}

function RescheduleDialog({
  appointment,
  onClose,
  hasConflict,
  onReschedule,
}: Pick<AgendaDialogsProps, 'onClose' | 'hasConflict' | 'onReschedule'> & { appointment: Appointment }) {
  const [date, setDate] = useState(appointment.date)
  const [time, setTime] = useState(appointment.time)
  const [error, setError] = useState('')

  async function confirm() {
    if (!date || !time) return
    if (await hasConflict(appointment, date, time)) {
      setError('Este veterinário já possui uma consulta nesse horário.')
      return
    }
    onReschedule(appointment, date, time)
  }

  return (
    <AgendaModal
      title={`Remarcar consulta de ${appointment.dogName}`}
      error={error}
      actions={
        <>
          <button className="secondary-button" onClick={onClose}>
            Voltar
          </button>
          <button className="primary-button" onClick={confirm}>
            Confirmar remarcação
          </button>
        </>
      }
    >
      <div className="modal-fields">
        <label>
          Nova data
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        <label>
          Novo horário
          <input type="time" value={time} onChange={(event) => setTime(event.target.value)} />
        </label>
      </div>
    </AgendaModal>
  )
}

function CancelDialog({
  appointment,
  onClose,
  onCancelAppointment,
}: Pick<AgendaDialogsProps, 'onClose' | 'onCancelAppointment'> & { appointment: Appointment }) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  function confirm() {
    if (!reason.trim()) {
      setError('Informe o motivo do cancelamento.')
      return
    }
    onCancelAppointment(appointment, reason.trim())
  }

  return (
    <AgendaModal
      title={`Cancelar consulta de ${appointment.dogName}`}
      error={error}
      actions={
        <>
          <button className="secondary-button" onClick={onClose}>
            Voltar
          </button>
          <button className="danger-button" onClick={confirm}>
            Cancelar consulta
          </button>
        </>
      }
    >
      <label className="cancel-reason">
        Motivo do cancelamento
        <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Descreva o motivo" />
      </label>
    </AgendaModal>
  )
}

function ReminderDialog({
  appointment,
  onClose,
  onAddReminder,
}: Pick<AgendaDialogsProps, 'onClose' | 'onAddReminder'> & { appointment: Appointment }) {
  const [type, setType] = useState<ReminderType>('return')
  const [date, setDate] = useState('')
  const [error, setError] = useState('')

  function confirm() {
    if (!date) {
      setError('Informe a data do lembrete.')
      return
    }
    onAddReminder(appointment, { id: Date.now(), type, date, done: false })
  }

  return (
    <AgendaModal
      title={`Novo lembrete para ${appointment.dogName}`}
      error={error}
      actions={
        <>
          <button className="secondary-button" onClick={onClose}>
            Voltar
          </button>
          <button className="primary-button" onClick={confirm}>
            Salvar lembrete
          </button>
        </>
      }
    >
      <div className="modal-fields">
        <label>
          Tipo
          <select value={type} onChange={(event) => setType(event.target.value as ReminderType)}>
            <option value="return">Retorno</option>
            <option value="vaccination">Vacinação</option>
          </select>
        </label>
        <label>
          Data
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
      </div>
    </AgendaModal>
  )
}

export function AgendaDialogs({ dialog, ...props }: AgendaDialogsProps) {
  const { appointment } = dialog
  if (dialog.kind === 'reschedule') return <RescheduleDialog appointment={appointment} {...props} />
  if (dialog.kind === 'cancel') return <CancelDialog appointment={appointment} {...props} />
  return <ReminderDialog appointment={appointment} {...props} />
}
