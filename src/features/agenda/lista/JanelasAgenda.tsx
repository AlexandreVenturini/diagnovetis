import { useState } from 'react'
import type { ReactNode } from 'react'
import type { Agendamento, LembreteAgendamento, TipoLembrete } from '../agendaTipos'

export type JanelaAgenda = { tipo: 'remarcar' | 'cancelar' | 'lembrete'; agendamento: Agendamento }

type JanelasAgendaProps = {
  janela: JanelaAgenda
  aoFechar: () => void
  temConflito: (agendamento: Agendamento, data: string, horario: string) => Promise<boolean>
  aoRemarcar: (agendamento: Agendamento, data: string, horario: string) => void
  aoCancelarAgendamento: (agendamento: Agendamento, motivo: string) => void
  aoAdicionarLembrete: (agendamento: Agendamento, lembrete: LembreteAgendamento) => void
}

function ModalAgenda({
  titulo,
  erro,
  children,
  acoes,
}: {
  titulo: string
  erro: string
  children: ReactNode
  acoes: ReactNode
}) {
  return (
    <div className="agenda-modal-backdrop" role="presentation">
      <section className="agenda-modal" role="dialog" aria-modal="true" aria-labelledby="agenda-dialog-title">
        <h3 id="agenda-dialog-title">{titulo}</h3>
        {children}
        {erro && <p className="dialog-error">{erro}</p>}
        <div className="modal-actions">{acoes}</div>
      </section>
    </div>
  )
}

function JanelaRemarcacao({
  agendamento,
  aoFechar,
  temConflito,
  aoRemarcar,
}: Pick<JanelasAgendaProps, 'aoFechar' | 'temConflito' | 'aoRemarcar'> & { agendamento: Agendamento }) {
  const [data, setData] = useState(agendamento.data)
  const [horario, setHorario] = useState(agendamento.horario)
  const [erro, setErro] = useState('')

  async function confirmacao() {
    if (!data || !horario) return
    if (await temConflito(agendamento, data, horario)) {
      setErro('Este veterinário já possui uma consulta nesse horário.')
      return
    }
    aoRemarcar(agendamento, data, horario)
  }

  return (
    <ModalAgenda
      titulo={`Remarcar consulta de ${agendamento.nomePet}`}
      erro={erro}
      acoes={
        <>
          <button className="secondary-button" onClick={aoFechar}>
            Voltar
          </button>
          <button className="primary-button" onClick={confirmacao}>
            Confirmar remarcação
          </button>
        </>
      }
    >
      <div className="modal-fields">
        <label>
          Nova data
          <input type="date" value={data} onChange={(evento) => setData(evento.target.value)} />
        </label>
        <label>
          Novo horário
          <input type="time" value={horario} onChange={(evento) => setHorario(evento.target.value)} />
        </label>
      </div>
    </ModalAgenda>
  )
}

function JanelaCancelamento({
  agendamento,
  aoFechar,
  aoCancelarAgendamento,
}: Pick<JanelasAgendaProps, 'aoFechar' | 'aoCancelarAgendamento'> & { agendamento: Agendamento }) {
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState('')

  function confirmacao() {
    if (!motivo.trim()) {
      setErro('Informe o motivo do cancelamento.')
      return
    }
    aoCancelarAgendamento(agendamento, motivo.trim())
  }

  return (
    <ModalAgenda
      titulo={`Cancelar consulta de ${agendamento.nomePet}`}
      erro={erro}
      acoes={
        <>
          <button className="secondary-button" onClick={aoFechar}>
            Voltar
          </button>
          <button className="danger-button" onClick={confirmacao}>
            Cancelar consulta
          </button>
        </>
      }
    >
      <label className="cancel-reason">
        Motivo do cancelamento
        <textarea
          value={motivo}
          onChange={(evento) => setMotivo(evento.target.value)}
          placeholder="Descreva o motivo"
        />
      </label>
    </ModalAgenda>
  )
}

function JanelaLembrete({
  agendamento,
  aoFechar,
  aoAdicionarLembrete,
}: Pick<JanelasAgendaProps, 'aoFechar' | 'aoAdicionarLembrete'> & { agendamento: Agendamento }) {
  const [tipo, setTipo] = useState<TipoLembrete>('return')
  const [data, setData] = useState('')
  const [erro, setErro] = useState('')

  function confirmacao() {
    if (!data) {
      setErro('Informe a data do lembrete.')
      return
    }
    aoAdicionarLembrete(agendamento, { id: Date.now(), tipo, data, concluido: false })
  }

  return (
    <ModalAgenda
      titulo={`Novo lembrete para ${agendamento.nomePet}`}
      erro={erro}
      acoes={
        <>
          <button className="secondary-button" onClick={aoFechar}>
            Voltar
          </button>
          <button className="primary-button" onClick={confirmacao}>
            Salvar lembrete
          </button>
        </>
      }
    >
      <div className="modal-fields">
        <label>
          Tipo
          <select value={tipo} onChange={(evento) => setTipo(evento.target.value as TipoLembrete)}>
            <option value="return">Retorno</option>
            <option value="vaccination">Vacinação</option>
          </select>
        </label>
        <label>
          Data
          <input type="date" value={data} onChange={(evento) => setData(evento.target.value)} />
        </label>
      </div>
    </ModalAgenda>
  )
}

export function JanelasAgenda({ janela, ...props }: JanelasAgendaProps) {
  const { agendamento } = janela
  if (janela.tipo === 'remarcar') return <JanelaRemarcacao agendamento={agendamento} {...props} />
  if (janela.tipo === 'cancelar') return <JanelaCancelamento agendamento={agendamento} {...props} />
  return <JanelaLembrete agendamento={agendamento} {...props} />
}
