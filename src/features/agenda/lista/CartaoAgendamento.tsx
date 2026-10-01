import { Icone } from '../../../components/common/Icone'
import type { Agendamento, SituacaoAgendamento } from '../agendaTipos'
import { ROTULOS_SITUACAO, formatarDataAgenda } from './filtrosAgenda'
import type { JanelaAgenda } from './JanelasAgenda'

const SITUACOES_ENCERRADAS: SituacaoAgendamento[] = ['completed', 'cancelled', 'no-show']

type CartaoAgendamentoProps = {
  agendamento: Agendamento
  expandido: boolean
  aoAlternar: () => void
  aoIniciarAtendimento?: (agendamento: Agendamento) => void
  aoAlterarSituacao: (status: SituacaoAgendamento) => void
  aoAbrirJanela: (tipo: JanelaAgenda['tipo']) => void
}

export function CartaoAgendamento({
  agendamento,
  expandido,
  aoAlternar,
  aoIniciarAtendimento,
  aoAlterarSituacao,
  aoAbrirJanela,
}: CartaoAgendamentoProps) {
  return (
    <article className={`appointment-card status-${agendamento.status}${expandido ? ' expanded' : ''}`}>
      <button className="appointment-card-summary" type="button" aria-expanded={expandido} onClick={aoAlternar}>
        <div>
          <div className="appointment-name-row">
            <strong>{agendamento.nomePet}</strong>
            <span className={`status-badge status-${agendamento.status}`}>{ROTULOS_SITUACAO[agendamento.status]}</span>
          </div>
          <p>Tutor: {agendamento.nomeTutor}</p>
          <div className="appointment-meta">
            <span>▣ {formatarDataAgenda(agendamento.data)}</span>
            <span>◷ {agendamento.horario || 'Horário não informado'}</span>
          </div>
        </div>
        <div className="appointment-card-side">
          <span className="service-label">{agendamento.tipoServico}</span>
          <span className="appointment-chevron">
            <Icone>
              <path d="m7 10 5 5 5-5" />
            </Icone>
          </span>
        </div>
      </button>
      {aoIniciarAtendimento && !SITUACOES_ENCERRADAS.includes(agendamento.status) && (
        <div className="appointment-care-action">
          <button type="button" className="primary-button" onClick={() => aoIniciarAtendimento(agendamento)}>
            Ir para atendimento
          </button>
        </div>
      )}
      {expandido && (
        <div className="appointment-details">
          <div>
            <span>Veterinário</span>
            <strong>{agendamento.veterinario || 'Não informado'}</strong>
          </div>
          <div>
            <span>Tipo</span>
            <strong>Horário marcado</strong>
          </div>
          <div>
            <span>Observações</span>
            <strong>{agendamento.observacoes || 'Nenhuma observação'}</strong>
          </div>
          {agendamento.motivoCancelamento && (
            <div className="appointment-notes">
              <span>Motivo do cancelamento</span>
              <strong>{agendamento.motivoCancelamento}</strong>
            </div>
          )}
          <div className="appointment-actions appointment-notes">
            <select
              aria-label="Alterar situação"
              value={agendamento.status}
              onChange={(evento) => aoAlterarSituacao(evento.target.value as SituacaoAgendamento)}
            >
              {Object.entries(ROTULOS_SITUACAO)
                .filter(([valor]) => valor !== 'cancelled')
                .map(([valor, rotulo]) => (
                  <option value={valor} key={valor}>
                    {rotulo}
                  </option>
                ))}
              {agendamento.status === 'cancelled' && <option value="cancelled">Cancelado</option>}
            </select>
            <button onClick={() => aoAbrirJanela('remarcar')}>Remarcar</button>
            <button onClick={() => aoAbrirJanela('lembrete')}>Criar lembrete</button>
            <button
              className="danger-action"
              disabled={agendamento.status === 'cancelled'}
              onClick={() => aoAbrirJanela('cancelar')}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </article>
  )
}
