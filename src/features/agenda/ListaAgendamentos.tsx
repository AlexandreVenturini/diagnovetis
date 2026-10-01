import { useMemo, useState } from 'react'
import { Icone } from '../../components/common/Icone'
import { FiltroPeriodo } from '../shared/FiltroPeriodo'
import { nomePeriodo, intervaloPeriodo, type Periodo } from '../shared/periodo'
import type { Agendamento, SituacaoAgendamento } from './agendaTipos'
import { JanelasAgenda, type JanelaAgenda } from './lista/JanelasAgenda'
import { CartaoAgendamento } from './lista/CartaoAgendamento'
import { PainelLembretes } from './lista/PainelLembretes'
import {
  ROTULOS_SITUACAO,
  agendamentosNoPeriodo,
  filtrarAgendamentos,
  temConflitoLocal,
  lembretesPendentes,
  paraCampoData,
  valoresUnicos,
} from './lista/filtrosAgenda'

type ListaAgendamentosProps = {
  agendamentos: Agendamento[]
  aoIniciarAtendimento?: (agendamento: Agendamento) => void
  aoCriar: () => void
  aoAtualizar: (id: number, alteracoes: Partial<Agendamento>) => void
  periodo?: Periodo
  aoAlterarPeriodo?: (valor: Periodo) => void
  busca?: string
  aoAlterarBusca?: (valor: string) => void
  agendamentosComLembrete?: Agendamento[]
  aoVerificarConflito?: (veterinario: string, data: string, horario: string, idIgnorado: number) => Promise<boolean>
  carregando?: boolean
}

export function ListaAgendamentos({
  agendamentos,
  aoCriar,
  aoAtualizar,
  aoIniciarAtendimento,
  periodo: periodoControlado,
  aoAlterarPeriodo,
  busca: buscaControlada,
  aoAlterarBusca,
  agendamentosComLembrete,
  aoVerificarConflito,
  carregando = false,
}: ListaAgendamentosProps) {
  const dataInicial = agendamentos.find((item) => item.data)?.data ?? paraCampoData(new Date())
  const [periodoLocal, setPeriodoLocal] = useState<Periodo>({ visao: 'semana', data: dataInicial })
  const [buscaLocal, setBuscaLocal] = useState('')
  const periodo = periodoControlado ?? periodoLocal
  const setPeriodo = aoAlterarPeriodo ?? setPeriodoLocal
  const busca = buscaControlada ?? buscaLocal
  const setBusca = aoAlterarBusca ?? setBuscaLocal
  const buscando = Boolean(busca.trim())
  const intervalo = buscando ? null : intervaloPeriodo(periodo)
  const [idExpandido, setIdExpandido] = useState<number | null>(null)
  const [veterinario, setVeterinario] = useState('todos')
  const [servico, setServico] = useState('todos')
  const [status, setStatus] = useState<SituacaoAgendamento | 'todos'>('todos')
  const [janela, setJanela] = useState<JanelaAgenda | null>(null)

  const veterinarios = valoresUnicos(agendamentos.map((item) => item.veterinario))
  const servicos = valoresUnicos(agendamentos.map((item) => item.tipoServico))
  const filtrados = useMemo(
    () => filtrarAgendamentos(agendamentos, { busca, veterinario, servico, status }),
    [agendamentos, busca, veterinario, servico, status],
  )
  const agendamentosVisiveis = agendamentosNoPeriodo(filtrados, intervalo, periodo.visao)
  const lembretes = lembretesPendentes(agendamentosComLembrete ?? agendamentos)

  async function temConflito(agendamento: Agendamento, data: string, horario: string) {
    return (
      temConflitoLocal(agendamentos, agendamento, data, horario) ||
      Boolean(await aoVerificarConflito?.(agendamento.veterinario, data, horario, agendamento.id))
    )
  }

  return (
    <section className="appointment-list">
      <div className="section-heading appointment-title-row">
        <div>
          <h2>Agenda de Consultas</h2>
          <p className="section-subtitle">Organize atendimentos, retornos e vacinações.</p>
        </div>
        <button className="primary-button new-button" onClick={aoCriar}>
          <Icone>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M7 3v4m10-4v4M3 10h18" />
          </Icone>
          Novo Agendamento
        </button>
      </div>

      <FiltroPeriodo rotulo="Visualização da agenda" valor={periodo} aoAlterar={setPeriodo} buscando={buscando}>
        <label className="agenda-search">
          <span>Buscar</span>
          <input value={busca} onChange={(evento) => setBusca(evento.target.value)} placeholder="Tutor ou animal" />
        </label>
        <label>
          <span>Veterinário</span>
          <select value={veterinario} onChange={(evento) => setVeterinario(evento.target.value)}>
            <option value="todos">Todos</option>
            {veterinarios.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Serviço</span>
          <select value={servico} onChange={(evento) => setServico(evento.target.value)}>
            <option value="todos">Todos</option>
            {servicos.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Situação</span>
          <select value={status} onChange={(evento) => setStatus(evento.target.value as SituacaoAgendamento | 'todos')}>
            <option value="todos">Todas</option>
            {Object.entries(ROTULOS_SITUACAO).map(([valor, rotulo]) => (
              <option value={valor} key={valor}>
                {rotulo}
              </option>
            ))}
          </select>
        </label>
      </FiltroPeriodo>

      <div className="agenda-grid enhanced-agenda-grid">
        <div className="upcoming-column">
          <div className="agenda-list-heading">
            <h3>{buscando ? 'Resultado da busca' : `Consultas ${nomePeriodo(periodo.visao)}`}</h3>
            <span>{agendamentosVisiveis.length} resultado(s)</span>
          </div>
          <div className="appointment-cards">
            {carregando && <div className="empty-appointments">Carregando agenda...</div>}
            {!carregando && agendamentosVisiveis.length === 0 && (
              <div className="empty-appointments">Nenhuma consulta encontrada neste período.</div>
            )}
            {agendamentosVisiveis.map((agendamento) => {
              const expandido = idExpandido === agendamento.id
              return (
                <CartaoAgendamento
                  key={agendamento.id}
                  agendamento={agendamento}
                  expandido={expandido}
                  aoAlternar={() => setIdExpandido(expandido ? null : agendamento.id)}
                  aoIniciarAtendimento={aoIniciarAtendimento}
                  aoAlterarSituacao={(proximo) => aoAtualizar(agendamento.id, { status: proximo })}
                  aoAbrirJanela={(tipo) => setJanela({ tipo, agendamento })}
                />
              )
            })}
          </div>
        </div>

        <PainelLembretes
          lembretes={lembretes}
          aoConcluir={(agendamento, lembreteId) =>
            aoAtualizar(agendamento.id, {
              lembretes: agendamento.lembretes.map((item) =>
                item.id === lembreteId ? { ...item, concluido: true } : item,
              ),
            })
          }
        />
      </div>

      {janela && (
        <JanelasAgenda
          key={`${janela.tipo}-${janela.agendamento.id}`}
          janela={janela}
          aoFechar={() => setJanela(null)}
          temConflito={temConflito}
          aoRemarcar={(agendamento, data, horario) => {
            aoAtualizar(agendamento.id, { data, horario, status: 'confirmed' })
            if (periodo.visao !== 'tudo') setPeriodo({ ...periodo, data })
            setJanela(null)
          }}
          aoCancelarAgendamento={(agendamento, motivo) => {
            aoAtualizar(agendamento.id, { status: 'cancelled', motivoCancelamento: motivo })
            setJanela(null)
          }}
          aoAdicionarLembrete={(agendamento, lembrete) => {
            aoAtualizar(agendamento.id, { lembretes: [...agendamento.lembretes, lembrete] })
            setJanela(null)
          }}
        />
      )}
    </section>
  )
}
