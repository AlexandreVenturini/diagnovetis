import { useMemo, useState } from 'react'
import type { DadosAtendimento } from '../atendimentoTipos'
import type { Agendamento } from '../../agenda/agendaTipos'
import type { OpcaoVeterinario } from '../../supervisao/supervisaoTipos'

type EtapaIdentificacaoProps = {
  dados: DadosAtendimento
  agendamentos: Agendamento[]
  idAgendamentoSelecionado: number | null
  aoSelecionarAgendamento: (id: number | null) => void
  atualizar: (key: keyof DadosAtendimento, valor: string) => void
  aoAvancar: () => void
  veterinarios: OpcaoVeterinario[]
  veterinarioBloqueado?: boolean
}

function formatarDataAgendamento(data: string) {
  if (!data) return 'Data não informada'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(`${data}T12:00:00`),
  )
}

export function EtapaIdentificacao({
  dados,
  agendamentos,
  idAgendamentoSelecionado,
  aoSelecionarAgendamento,
  atualizar,
  aoAvancar,
  veterinarios,
  veterinarioBloqueado = false,
}: EtapaIdentificacaoProps) {
  const [buscaAgendamento, setBuscaAgendamento] = useState('')
  const [buscaAberta, setBuscaAberta] = useState(false)
  const concluir = dados.nomePet && dados.idade && dados.raca && dados.nomeTutor && dados.veterinarioId
  const buscaNormalizada = buscaAgendamento.trim().toLocaleLowerCase('pt-BR')
  const agendamentosFiltrados = useMemo(
    () =>
      agendamentos
        .filter((item) => {
          const pesquisavel =
            `${item.nomePet} ${item.nomeTutor} ${item.data} ${formatarDataAgendamento(item.data)} ${item.horario} ${item.tipoServico} ${item.veterinario}`.toLocaleLowerCase(
              'pt-BR',
            )
          return pesquisavel.includes(buscaNormalizada)
        })
        .slice(0, 8),
    [agendamentos, buscaNormalizada],
  )
  const agendamentoSelecionado = agendamentos.find((agendamento) => agendamento.id === idAgendamentoSelecionado)

  function escolherVeterinario(medicoId: string) {
    const veterinario = veterinarios.find((item) => String(item.medicoId) === medicoId)
    atualizar('veterinarioId', medicoId)
    atualizar('veterinario', veterinario?.nome ?? '')
  }

  function escolherAgendamento(item: Agendamento) {
    aoSelecionarAgendamento(item.id)
    setBuscaAgendamento('')
    setBuscaAberta(false)
  }

  return (
    <section className="consultation-panel content-card">
      <h2>1. Identificação do Paciente</h2>
      <div className="appointment-import">
        <div>
          <strong>Importar dados do agendamento</strong>
          <p>Selecione uma consulta para preencher automaticamente a identificação do paciente.</p>
        </div>
        <label className="consultation-appointment-search">
          Buscar agendamento
          <input
            value={buscaAgendamento}
            onFocus={() => setBuscaAberta(true)}
            onBlur={() => window.setTimeout(() => setBuscaAberta(false), 120)}
            onChange={(evento) => {
              setBuscaAgendamento(evento.target.value)
              setBuscaAberta(true)
            }}
            placeholder="Digite o cão, tutor, data, horário ou serviço"
            autoComplete="off"
          />
          {buscaAberta && buscaNormalizada && (
            <div className="consultation-appointment-results">
              {agendamentosFiltrados.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onMouseDown={(evento) => evento.preventDefault()}
                  onClick={() => escolherAgendamento(item)}
                >
                  <span>
                    <strong>{item.nomePet}</strong>
                    <small>
                      Tutor: {item.nomeTutor} · {item.tipoServico}
                    </small>
                  </span>
                  <time>
                    {formatarDataAgendamento(item.data)}
                    <b>{item.horario || 'Sem horário'}</b>
                  </time>
                </button>
              ))}
              {agendamentosFiltrados.length === 0 && <p>Nenhum agendamento encontrado para esta busca.</p>}
            </div>
          )}
        </label>
        {agendamentoSelecionado && (
          <>
            <div className="selected-appointment-heading">
              <strong>Agendamento selecionado</strong>
              <button
                type="button"
                onClick={() => {
                  aoSelecionarAgendamento(null)
                  setBuscaAgendamento('')
                }}
              >
                Remover vínculo
              </button>
            </div>
            <div className="imported-appointment-summary">
              <span>
                <b>Paciente</b>
                {agendamentoSelecionado.nomePet}
              </span>
              <span>
                <b>Tutor</b>
                {agendamentoSelecionado.nomeTutor}
              </span>
              <span>
                <b>Serviço</b>
                {agendamentoSelecionado.tipoServico}
              </span>
              <span>
                <b>Horário</b>
                {formatarDataAgendamento(agendamentoSelecionado.data)} às{' '}
                {agendamentoSelecionado.horario || 'Sem horário'}
              </span>
            </div>
          </>
        )}
      </div>
      <div className="consultation-form-grid">
        <label>
          Nome do Cão *
          <input
            value={dados.nomePet}
            onChange={(evento) => atualizar('nomePet', evento.target.value)}
            placeholder="Ex: Rex"
          />
        </label>
        <label>
          Idade *
          <input
            value={dados.idade}
            onChange={(evento) => atualizar('idade', evento.target.value)}
            placeholder="Ex: 5 anos"
          />
        </label>
        <label>
          Raça *
          <select value={dados.raca} onChange={(evento) => atualizar('raca', evento.target.value)}>
            <option value="">Selecione a raça</option>
            <option>Labrador</option>
            <option>Pastor Alemão</option>
            <option>Golden Retriever</option>
            <option>Poodle</option>
            <option>Vira-lata</option>
          </select>
        </label>
        <label>
          Nome do Tutor *
          <input
            value={dados.nomeTutor}
            onChange={(evento) => atualizar('nomeTutor', evento.target.value)}
            placeholder="Ex: Maria Silva"
          />
        </label>
        <label>
          {veterinarioBloqueado ? 'Professor supervisor' : 'Veterinário que Atendeu *'}
          <select
            value={dados.veterinarioId}
            onChange={(evento) => escolherVeterinario(evento.target.value)}
            disabled={veterinarioBloqueado}
          >
            <option value="">{veterinarios.length ? 'Selecione o veterinário' : 'Carregando veterinários...'}</option>
            {veterinarios.map((veterinario) => (
              <option key={veterinario.medicoId} value={String(veterinario.medicoId)}>
                {veterinario.nome} — CRMV {veterinario.crmv}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="consultation-next">
        <button className="primary-button" disabled={!concluir} onClick={aoAvancar}>
          Próximo: Histórico Clínico →
        </button>
      </div>
    </section>
  )
}
