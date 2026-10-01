import { useMemo, useState } from 'react'
import { useAgendamentos } from '../agenda/useAgendamentos'
import type { Agendamento, SituacaoAgendamento } from '../agenda/agendaTipos'
import type { PetResumo } from '../pets/petTipos'
import type { ModuloPainel } from './useNavegacaoPainel'

type InicioVeterinarioProps = {
  pets: PetResumo[]
  aoAbrirModulo: (modulo: ModuloPainel) => void
  aoNovoPet: () => void
  aoNovoAgendamento: () => void
}

const ROTULOS_SITUACAO: Record<SituacaoAgendamento, string> = {
  confirmed: 'Confirmada',
  waiting: 'Aguardando',
  'in-progress': 'Em atendimento',
  completed: 'Concluída',
  'no-show': 'Faltou',
  cancelled: 'Cancelada',
}
const chaveHoje = () => {
  const agora = new Date()
  const deslocamento = agora.getTimezoneOffset()
  return new Date(agora.getTime() - deslocamento * 60_000).toISOString().slice(0, 10)
}
const formatarHorario = (data: Date) => data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

function CartaoIndicador({
  tom,
  rotulo,
  valor,
  detalhe,
}: {
  tom: string
  rotulo: string
  valor: number
  detalhe: string
}) {
  return (
    <article className={`dashboard-stat dashboard-stat-${tom}`}>
      <span>{rotulo}</span>
      <strong>{valor}</strong>
      <small>{detalhe}</small>
    </article>
  )
}

export function InicioVeterinario({ pets, aoAbrirModulo, aoNovoPet, aoNovoAgendamento }: InicioVeterinarioProps) {
  const { agendamentos } = useAgendamentos()
  const [atualizadoEm, setAtualizadoEm] = useState(new Date())
  const [status, setStatus] = useState<SituacaoAgendamento | 'todos'>('todos')
  const hoje = chaveHoje()
  const agendamentosHoje = useMemo(
    () =>
      agendamentos
        .filter((item) => item.data === hoje && item.status !== 'cancelled')
        .sort((a, b) => a.horario.localeCompare(b.horario)),
    [agendamentos, hoje],
  )
  const agendamentosVisiveis =
    status === 'todos' ? agendamentosHoje : agendamentosHoje.filter((item) => item.status === status)
  const pendentes = agendamentosHoje.filter((item) => item.status === 'waiting' || item.status === 'in-progress')
  const lembretesPendentes = agendamentos.flatMap((item) =>
    item.lembretes.filter((lembrete) => !lembrete.concluido && lembrete.data <= hoje),
  )
  const alertasClinicos = pendentes.length + lembretesPendentes.length

  return (
    <section className="dashboard-home">
      <header className="dashboard-hero">
        <div>
          <span>Centro de comando operacional</span>
          <h1>Equipe DiagnoVetis.</h1>
          <p>Veja o que acontece agora, o que exige atenção e qual é o próximo passo.</p>
        </div>
        <div className="dashboard-sync">
          <div>
            <i />{' '}
            <span>
              <b>Sistema conectado</b>
              <small>Atualizado às {formatarHorario(atualizadoEm)}</small>
            </span>
          </div>
          <button onClick={() => setAtualizadoEm(new Date())}>Atualizar dados</button>
        </div>
      </header>

      <div className="dashboard-stats">
        <CartaoIndicador
          tom="green"
          rotulo="Consultas hoje"
          valor={agendamentosHoje.length}
          detalhe={pendentes.length ? `${pendentes.length} aguardando ação` : 'Nenhuma pendência hoje'}
        />
        <CartaoIndicador
          tom="teal"
          rotulo="Pacientes cadastrados"
          valor={pets.length}
          detalhe="Animais disponíveis no cadastro"
        />
        <CartaoIndicador
          tom="amber"
          rotulo="Lembretes pendentes"
          valor={lembretesPendentes.length}
          detalhe={lembretesPendentes.length ? 'Retornos ou vacinações vencendo' : 'Nenhum lembrete em atraso'}
        />
        <CartaoIndicador
          tom="red"
          rotulo="Alertas clínicos"
          valor={alertasClinicos}
          detalhe={alertasClinicos ? 'Itens exigem acompanhamento' : 'Acompanhamento em dia'}
        />
      </div>

      <div className="dashboard-main-grid">
        <section className="dashboard-panel dashboard-agenda">
          <div className="dashboard-panel-heading">
            <div>
              <span>Operação do dia</span>
              <h2>Agenda de atendimentos</h2>
            </div>
            <button onClick={() => aoAbrirModulo('agenda')}>
              Ver agenda completa <b>→</b>
            </button>
          </div>
          {agendamentosHoje.length > 0 && (
            <div className="dashboard-filters">
              {(
                [
                  ['todos', 'Todos'],
                  ['waiting', 'Aguardando'],
                  ['in-progress', 'Em atendimento'],
                  ['completed', 'Concluídos'],
                ] as const
              ).map(([valor, rotulo]) => (
                <button className={status === valor ? 'active' : ''} key={valor} onClick={() => setStatus(valor)}>
                  {rotulo}
                </button>
              ))}
            </div>
          )}
          <div className="dashboard-appointment-list">
            {agendamentosVisiveis.map((item) => (
              <LinhaAgendamento key={item.id} item={item} aoAbrir={() => aoAbrirModulo('agenda')} />
            ))}
            {agendamentosVisiveis.length === 0 && (
              <div className="dashboard-empty">
                <strong>
                  {agendamentosHoje.length ? 'Nenhum atendimento neste filtro.' : 'Nenhuma consulta para hoje.'}
                </strong>
                <p>Use o módulo de Agendamento para organizar o próximo atendimento.</p>
                <button onClick={aoNovoAgendamento}>Abrir agendamento</button>
              </div>
            )}
          </div>
        </section>
        <section className="dashboard-panel dashboard-attention">
          <div className="dashboard-panel-heading">
            <div>
              <span>Decisão clínica</span>
              <h2>
                Atenção necessária <em>{alertasClinicos}</em>
              </h2>
            </div>
            <i>!</i>
          </div>
          {alertasClinicos ? (
            <div className="attention-items">
              <strong>{alertasClinicos} ação(ões) aguardando revisão.</strong>
              <p>Há atendimentos em andamento ou lembretes vencidos.</p>
            </div>
          ) : (
            <div className="attention-items">
              <strong>Nenhum alerta clínico aberto.</strong>
              <p>O acompanhamento está em dia.</p>
            </div>
          )}
          <button onClick={() => aoAbrirModulo('condicoes')}>Consultar condições clínicas</button>
        </section>
      </div>

      <section className="quick-actions">
        <div>
          <span>Ações rápidas</span>
          <h2>Comece pelo contexto certo.</h2>
          <p>Os atalhos levam aos fluxos de trabalho já disponíveis no sistema.</p>
        </div>
        <div>
          <button onClick={aoNovoPet}>＋ Novo cadastro</button>
          <button onClick={aoNovoAgendamento}>＋ Novo agendamento</button>
          <button onClick={() => aoAbrirModulo('atendimentos')}>＋ Iniciar atendimento</button>
        </div>
      </section>

      <div className="dashboard-flow">
        <b>Dashboard</b>
        <span>—</span>
        <b>Atendimento</b>
        <span>—</span>
        <b>Prontuário</b>
        <p>O diagnóstico é registrado dentro do atendimento e permanece na consulta/prontuário do paciente.</p>
      </div>
      <section className="operational-summary dashboard-panel">
        <div className="dashboard-panel-heading">
          <div>
            <span>Resumo operacional</span>
            <h2>O estado do atendimento agora</h2>
          </div>
          <small>Atualizado às {formatarHorario(atualizadoEm)}</small>
        </div>
        <div>
          <article>
            <b>01</b>
            <span>
              <strong>{agendamentosHoje.length} consulta(s) hoje</strong>
              <small>Compromissos registrados na agenda</small>
            </span>
          </article>
          <article>
            <b>02</b>
            <span>
              <strong>{pets.length} paciente(s) cadastrado(s)</strong>
              <small>Registros disponíveis no prontuário</small>
            </span>
          </article>
          <article>
            <b>03</b>
            <span>
              <strong>{alertasClinicos} ação(ões) pendente(s)</strong>
              <small>Itens que pedem acompanhamento</small>
            </span>
          </article>
        </div>
      </section>
    </section>
  )
}

function LinhaAgendamento({ item, aoAbrir }: { item: Agendamento; aoAbrir: () => void }) {
  return (
    <button className="dashboard-appointment" onClick={aoAbrir}>
      <time>{item.horario || 'Encaixe'}</time>
      <span className="appointment-avatar">{item.nomePet.slice(0, 1).toUpperCase()}</span>
      <span>
        <strong>{item.nomePet}</strong>
        <small>
          {item.nomeTutor} · {item.tipoServico}
        </small>
      </span>
      <em className={`status-${item.status}`}>{ROTULOS_SITUACAO[item.status]}</em>
      <b>›</b>
    </button>
  )
}
