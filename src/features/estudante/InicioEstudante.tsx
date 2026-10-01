import { useMemo } from 'react'
import { useAgendamentos } from '../agenda/useAgendamentos'
import type { PetResumo } from '../pets/petTipos'

type Props = {
  pets: PetResumo[]
  aoAbrirPets: () => void
  aoAbrirAgenda: () => void
  aoNovoPet: () => void
  aoNovoAgendamento: () => void
}
const dataLocal = () => {
  const agora = new Date()
  return new Date(agora.getTime() - agora.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}
const dataExibida = (valor: string) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(`${valor}T12:00:00`))

export function InicioEstudante({ pets, aoAbrirPets, aoAbrirAgenda, aoNovoPet, aoNovoAgendamento }: Props) {
  const { agendamentos } = useAgendamentos()
  const hoje = dataLocal()
  const itensHoje = useMemo(
    () =>
      agendamentos
        .filter((item) => item.data === hoje && item.status !== 'cancelled')
        .sort((a, b) => a.horario.localeCompare(b.horario)),
    [agendamentos, hoje],
  )
  const proximos = useMemo(
    () =>
      agendamentos
        .filter((item) => item.data >= hoje && item.status !== 'cancelled')
        .sort((a, b) => `${a.data}${a.horario}`.localeCompare(`${b.data}${b.horario}`))
        .slice(0, 5),
    [agendamentos, hoje],
  )
  const confirmado = itensHoje.filter((item) => item.status === 'confirmed').length

  return (
    <section className="attendant-home">
      <header className="attendant-hero">
        <div>
          <span>Painel administrativo</span>
          <h1>Olá, equipe de atendimento!</h1>
          <p>Organize os cadastros e mantenha a agenda da clínica sempre em dia.</p>
        </div>
        <div>
          <i /> Operação disponível
        </div>
      </header>
      <div className="attendant-metrics">
        <article>
          <span>🐾</span>
          <div>
            <small>Cães cadastrados</small>
            <strong>{pets.length}</strong>
            <p>Registros disponíveis</p>
          </div>
          <button onClick={aoAbrirPets}>Ver cadastro →</button>
        </article>
        <article>
          <span>▣</span>
          <div>
            <small>Agendamentos hoje</small>
            <strong>{itensHoje.length}</strong>
            <p>{confirmado} consulta(s) confirmada(s)</p>
          </div>
          <button onClick={aoAbrirAgenda}>Ver agenda →</button>
        </article>
      </div>
      <section className="attendant-actions">
        <div>
          <span>Ações do atendente</span>
          <h2>O que você precisa fazer agora?</h2>
          <p>Acesse diretamente as rotinas administrativas mais utilizadas.</p>
        </div>
        <div>
          <button onClick={aoNovoPet}>
            <b>＋</b>
            <span>
              <strong>Cadastrar novo cão</strong>
              <small>Adicionar paciente e tutor</small>
            </span>
          </button>
          <button onClick={aoNovoAgendamento}>
            <b>＋</b>
            <span>
              <strong>Criar agendamento</strong>
              <small>Reservar data e horário</small>
            </span>
          </button>
        </div>
      </section>
      <div className="attendant-content-grid">
        <section className="attendant-card">
          <header>
            <div>
              <span>Agenda</span>
              <h2>Próximos agendamentos</h2>
            </div>
            <button onClick={aoAbrirAgenda}>Agenda completa →</button>
          </header>
          <div className="attendant-schedule">
            {proximos.map((item) => (
              <button key={item.id} onClick={aoAbrirAgenda}>
                <time>
                  <b>{item.data === hoje ? 'Hoje' : dataExibida(item.data)}</b>
                  <span>{item.horario || 'Encaixe'}</span>
                </time>
                <i>{item.nomePet.charAt(0).toUpperCase()}</i>
                <span>
                  <strong>{item.nomePet}</strong>
                  <small>
                    {item.nomeTutor} · {item.tipoServico}
                  </small>
                </span>
                <em>{item.status === 'confirmed' ? 'Confirmada' : 'Agendada'}</em>
              </button>
            ))}
            {proximos.length === 0 && (
              <div className="attendant-empty">
                <span>▣</span>
                <strong>Nenhum agendamento futuro.</strong>
                <p>Crie um novo horário para começar a organizar a agenda.</p>
                <button onClick={aoNovoAgendamento}>Novo agendamento</button>
              </div>
            )}
          </div>
        </section>
        <section className="attendant-card recent-dogs">
          <header>
            <div>
              <span>Cadastro</span>
              <h2>Últimos cães cadastrados</h2>
            </div>
            <button onClick={aoAbrirPets}>Ver todos →</button>
          </header>
          <div>
            {pets
              .slice(-4)
              .reverse()
              .map((pet) => (
                <button key={pet.id} onClick={aoAbrirPets}>
                  <i>{pet.nome.charAt(0).toUpperCase()}</i>
                  <span>
                    <strong>{pet.nome}</strong>
                    <small>
                      {pet.raca || 'Raça não informada'} · Tutor: {pet.tutor}
                    </small>
                  </span>
                  <b>›</b>
                </button>
              ))}
            {pets.length === 0 && (
              <div className="attendant-empty">
                <span>🐾</span>
                <strong>Nenhum cão cadastrado.</strong>
                <p>Cadastre o primeiro paciente da clínica.</p>
                <button onClick={aoNovoPet}>Novo cadastro</button>
              </div>
            )}
          </div>
        </section>
      </div>
      <footer className="attendant-footer-note">
        <span>✓</span>
        <div>
          <strong>Área administrativa protegida</strong>
          <p>Seu perfil possui acesso somente a cadastros e agendamentos.</p>
        </div>
      </footer>
    </section>
  )
}
