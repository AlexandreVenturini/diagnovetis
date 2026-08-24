import { useMemo } from 'react'
import { useAppointments } from '../../hooks/useAppointments'
import type { Dog } from '../dogs/dogTypes'

type Props = { dogs: Dog[]; onOpenDogs: () => void; onOpenAppointments: () => void; onNewDog: () => void; onNewAppointment: () => void }
const localDate = () => { const now = new Date(); return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10) }
const displayDate = (value: string) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(`${value}T12:00:00`))

export function AttendantHome({ dogs, onOpenDogs, onOpenAppointments, onNewDog, onNewAppointment }: Props) {
  const { appointments } = useAppointments()
  const today = localDate()
  const todayItems = useMemo(() => appointments.filter(item => item.date === today && item.status !== 'cancelled').sort((a, b) => a.time.localeCompare(b.time)), [appointments, today])
  const upcoming = useMemo(() => appointments.filter(item => item.date >= today && item.status !== 'cancelled').sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)).slice(0, 5), [appointments, today])
  const confirmed = todayItems.filter(item => item.status === 'confirmed').length

  return <section className="attendant-home">
    <header className="attendant-hero"><div><span>Painel administrativo</span><h1>Olá, equipe de atendimento!</h1><p>Organize os cadastros e mantenha a agenda da clínica sempre em dia.</p></div><div><i /> Operação disponível</div></header>
    <div className="attendant-metrics"><article><span>🐾</span><div><small>Cães cadastrados</small><strong>{dogs.length}</strong><p>Registros disponíveis</p></div><button onClick={onOpenDogs}>Ver cadastro →</button></article><article><span>▣</span><div><small>Agendamentos hoje</small><strong>{todayItems.length}</strong><p>{confirmed} consulta(s) confirmada(s)</p></div><button onClick={onOpenAppointments}>Ver agenda →</button></article></div>
    <section className="attendant-actions"><div><span>Ações do atendente</span><h2>O que você precisa fazer agora?</h2><p>Acesse diretamente as rotinas administrativas mais utilizadas.</p></div><div><button onClick={onNewDog}><b>＋</b><span><strong>Cadastrar novo cão</strong><small>Adicionar paciente e tutor</small></span></button><button onClick={onNewAppointment}><b>＋</b><span><strong>Criar agendamento</strong><small>Reservar data e horário</small></span></button></div></section>
    <div className="attendant-content-grid"><section className="attendant-card"><header><div><span>Agenda</span><h2>Próximos agendamentos</h2></div><button onClick={onOpenAppointments}>Agenda completa →</button></header><div className="attendant-schedule">{upcoming.map(item => <button key={item.id} onClick={onOpenAppointments}><time><b>{item.date === today ? 'Hoje' : displayDate(item.date)}</b><span>{item.time || 'Encaixe'}</span></time><i>{item.dogName.charAt(0).toUpperCase()}</i><span><strong>{item.dogName}</strong><small>{item.tutorName} · {item.serviceType}</small></span><em>{item.status === 'confirmed' ? 'Confirmada' : 'Agendada'}</em></button>)}{upcoming.length === 0 && <div className="attendant-empty"><span>▣</span><strong>Nenhum agendamento futuro.</strong><p>Crie um novo horário para começar a organizar a agenda.</p><button onClick={onNewAppointment}>Novo agendamento</button></div>}</div></section>
      <section className="attendant-card recent-dogs"><header><div><span>Cadastro</span><h2>Últimos cães cadastrados</h2></div><button onClick={onOpenDogs}>Ver todos →</button></header><div>{dogs.slice(-4).reverse().map(dog => <button key={dog.id} onClick={onOpenDogs}><i>{dog.name.charAt(0).toUpperCase()}</i><span><strong>{dog.name}</strong><small>{dog.breed || 'Raça não informada'} · Tutor: {dog.tutor}</small></span><b>›</b></button>)}{dogs.length === 0 && <div className="attendant-empty"><span>🐾</span><strong>Nenhum cão cadastrado.</strong><p>Cadastre o primeiro paciente da clínica.</p><button onClick={onNewDog}>Novo cadastro</button></div>}</div></section></div>
    <footer className="attendant-footer-note"><span>✓</span><div><strong>Área administrativa protegida</strong><p>Seu perfil possui acesso somente a cadastros e agendamentos.</p></div></footer>
  </section>
}
