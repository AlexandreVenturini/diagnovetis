import { useMemo, useState } from 'react'
import { useAppointments } from '../../hooks/useAppointments'
import type { Appointment, AppointmentStatus } from '../appointments/appointmentTypes'
import type { Dog } from '../dogs/dogTypes'

type DashboardHomeProps = {
  dogs: Dog[]
  onOpenModule: (module: string) => void
  onNewDog: () => void
  onNewAppointment: () => void
}

const STATUS_LABELS: Record<AppointmentStatus, string> = { confirmed: 'Confirmada', waiting: 'Aguardando', 'in-progress': 'Em atendimento', completed: 'Concluída', 'no-show': 'Faltou', cancelled: 'Cancelada' }
const todayKey = () => { const now = new Date(); const offset = now.getTimezoneOffset(); return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10) }
const formatTime = (date: Date) => date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

function StatCard({ tone, label, value, detail }: { tone: string; label: string; value: number; detail: string }) {
  return <article className={`dashboard-stat dashboard-stat-${tone}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>
}

export function DashboardHome({ dogs, onOpenModule, onNewDog, onNewAppointment }: DashboardHomeProps) {
  const { appointments } = useAppointments()
  const [updatedAt, setUpdatedAt] = useState(new Date())
  const [status, setStatus] = useState<AppointmentStatus | 'all'>('all')
  const today = todayKey()
  const todayAppointments = useMemo(() => appointments.filter((item) => item.date === today && item.status !== 'cancelled').sort((a, b) => a.time.localeCompare(b.time)), [appointments, today])
  const visibleAppointments = status === 'all' ? todayAppointments : todayAppointments.filter((item) => item.status === status)
  const pending = todayAppointments.filter((item) => item.status === 'waiting' || item.status === 'in-progress')
  const pendingReminders = appointments.flatMap((item) => item.reminders.filter((reminder) => !reminder.done && reminder.date <= today))
  const clinicalAlerts = pending.length + pendingReminders.length

  return <section className="dashboard-home">
    <header className="dashboard-hero"><div><span>Centro de comando operacional</span><h1>Equipe DiagnoVetis.</h1><p>Veja o que acontece agora, o que exige atenção e qual é o próximo passo.</p></div><div className="dashboard-sync"><div><i /> <span><b>Sistema conectado</b><small>Atualizado às {formatTime(updatedAt)}</small></span></div><button onClick={() => setUpdatedAt(new Date())}>Atualizar dados</button></div></header>

    <div className="dashboard-stats"><StatCard tone="green" label="Consultas hoje" value={todayAppointments.length} detail={pending.length ? `${pending.length} aguardando ação` : 'Nenhuma pendência hoje'} /><StatCard tone="teal" label="Pacientes cadastrados" value={dogs.length} detail="Animais disponíveis no cadastro" /><StatCard tone="amber" label="Lembretes pendentes" value={pendingReminders.length} detail={pendingReminders.length ? 'Retornos ou vacinações vencendo' : 'Nenhum lembrete em atraso'} /><StatCard tone="red" label="Alertas clínicos" value={clinicalAlerts} detail={clinicalAlerts ? 'Itens exigem acompanhamento' : 'Acompanhamento em dia'} /></div>

    <div className="dashboard-main-grid"><section className="dashboard-panel dashboard-agenda"><div className="dashboard-panel-heading"><div><span>Operação do dia</span><h2>Agenda de atendimentos</h2></div><button onClick={() => onOpenModule('appointments')}>Ver agenda completa <b>→</b></button></div>
      {todayAppointments.length > 0 && <div className="dashboard-filters">{([['all', 'Todos'], ['waiting', 'Aguardando'], ['in-progress', 'Em atendimento'], ['completed', 'Concluídos']] as const).map(([value, label]) => <button className={status === value ? 'active' : ''} key={value} onClick={() => setStatus(value)}>{label}</button>)}</div>}
      <div className="dashboard-appointment-list">{visibleAppointments.map((item) => <AppointmentRow key={item.id} item={item} onOpen={() => onOpenModule('appointments')} />)}{visibleAppointments.length === 0 && <div className="dashboard-empty"><strong>{todayAppointments.length ? 'Nenhum atendimento neste filtro.' : 'Nenhuma consulta para hoje.'}</strong><p>Use o módulo de Agendamento para organizar o próximo atendimento.</p><button onClick={onNewAppointment}>Abrir agendamento</button></div>}</div>
    </section><section className="dashboard-panel dashboard-attention"><div className="dashboard-panel-heading"><div><span>Decisão clínica</span><h2>Atenção necessária <em>{clinicalAlerts}</em></h2></div><i>!</i></div>{clinicalAlerts ? <div className="attention-items"><strong>{clinicalAlerts} ação(ões) aguardando revisão.</strong><p>Há atendimentos em andamento ou lembretes vencidos.</p></div> : <div className="attention-items"><strong>Nenhum alerta clínico aberto.</strong><p>O acompanhamento está em dia.</p></div>}<button onClick={() => onOpenModule('zoonoses')}>Consultar módulo de zoonoses</button></section></div>

    <section className="quick-actions"><div><span>Ações rápidas</span><h2>Comece pelo contexto certo.</h2><p>Os atalhos levam aos fluxos de trabalho já disponíveis no sistema.</p></div><div><button onClick={onNewDog}>＋ Novo cadastro</button><button onClick={onNewAppointment}>＋ Novo agendamento</button><button onClick={() => onOpenModule('consultations')}>＋ Iniciar atendimento</button></div></section>

    <div className="dashboard-flow"><b>Dashboard</b><span>—</span><b>Atendimento</b><span>—</span><b>Prontuário</b><p>O diagnóstico é registrado dentro do atendimento e permanece na consulta/prontuário do paciente.</p></div>
    <section className="operational-summary dashboard-panel"><div className="dashboard-panel-heading"><div><span>Resumo operacional</span><h2>O estado do atendimento agora</h2></div><small>Atualizado às {formatTime(updatedAt)}</small></div><div><article><b>01</b><span><strong>{todayAppointments.length} consulta(s) hoje</strong><small>Compromissos registrados na agenda</small></span></article><article><b>02</b><span><strong>{dogs.length} paciente(s) cadastrado(s)</strong><small>Registros disponíveis no prontuário</small></span></article><article><b>03</b><span><strong>{clinicalAlerts} ação(ões) pendente(s)</strong><small>Itens que pedem acompanhamento</small></span></article></div></section>
  </section>
}

function AppointmentRow({ item, onOpen }: { item: Appointment; onOpen: () => void }) { return <button className="dashboard-appointment" onClick={onOpen}><time>{item.time || 'Encaixe'}</time><span className="appointment-avatar">{item.dogName.slice(0, 1).toUpperCase()}</span><span><strong>{item.dogName}</strong><small>{item.tutorName} · {item.serviceType}</small></span><em className={`status-${item.status}`}>{STATUS_LABELS[item.status]}</em><b>›</b></button> }
