import { useState } from 'react'
import { SupervisionService } from '../../../services/SupervisionService'
import { LIBERACAO } from '../liberationKinds'
import type { Liberacao, ObitoParaAprovar, ReceitaParaAprovar, TipoLiberacao } from '../supervisionTypes'
import { ParticipantsPicker } from './ParticipantsPicker'
import { WaitingApproval } from './WaitingApproval'
import { useRemoteApproval } from './useRemoteApproval'
import { useSupervisionOptions } from './useSupervisionOptions'

const supervisionService = new SupervisionService()

type SupervisionGateProps = {
  onLiberado: (liberacao: Liberacao) => void
  consultaId?: number
  receita?: ReceitaParaAprovar
  obito?: ObitoParaAprovar
  onCancel?: () => void
  onRecusado?: (mensagem: string) => void
}

function tipoDoPedido({ consultaId, receita, obito }: Pick<SupervisionGateProps, 'consultaId' | 'receita' | 'obito'>) {
  if (obito) return 'obito'
  if (receita) return 'receita'
  if (consultaId !== undefined) return 'retificacao'
  return 'atendimento'
}

export function SupervisionGate({
  onLiberado,
  consultaId,
  receita,
  obito,
  onCancel,
  onRecusado,
}: SupervisionGateProps) {
  const alvo = { consultaId, receita, obito }
  const tipo: TipoLiberacao = tipoDoPedido(alvo)
  const textos = LIBERACAO[tipo]
  const [supervisorId, setSupervisorId] = useState('')
  const [participants, setParticipants] = useState<string[]>([])
  const [password, setPassword] = useState('')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const { veterinarians, students, loading } = useSupervisionOptions(setMessage)
  const remote = useRemoteApproval(tipo, { onLiberado, onRecusado, onMessage: setMessage })

  const supervisor = veterinarians.find((vet) => vet.profileId === supervisorId)
  const selectedStudents = students.filter((student) => participants.includes(student.profileId))
  const participantIds = textos.comParticipantes ? participants : []

  function toggleParticipant(profileId: string) {
    setParticipants((current) =>
      current.includes(profileId) ? current.filter((id) => id !== profileId) : [...current, profileId],
    )
  }

  async function liberarComSenha() {
    if (sending) return
    if (!supervisor) {
      setMessage('Selecione o professor responsável pela supervisão.')
      return
    }
    if (!password) {
      setMessage('O professor precisa digitar a senha para liberar o atendimento.')
      return
    }
    setSending(true)
    setMessage('')
    try {
      const id = await supervisionService.liberarComSenha(supervisor.profileId, password, participantIds, alvo)
      setPassword('')
      if (!id) {
        setMessage('Senha incorreta. Peça ao professor para digitar novamente.')
        return
      }
      onLiberado({ id, supervisor, participantes: selectedStudents })
    } catch (error) {
      setPassword('')
      const text = (error as Error).message
      setMessage(text.includes('tentativas') ? text : `Não foi possível liberar ${textos.alvo}. Tente novamente.`)
    } finally {
      setSending(false)
    }
  }

  async function enviarPedido() {
    if (sending) return
    if (!supervisor) {
      setMessage('Selecione o professor responsável pela supervisão.')
      return
    }
    setSending(true)
    setMessage('')
    try {
      const id = await supervisionService.solicitar(supervisor.profileId, participantIds, alvo)
      remote.aguardar({ id, supervisor, participantes: selectedStudents, enviadoEm: Date.now() })
    } catch {
      setMessage('Não foi possível enviar o pedido ao professor. Tente novamente.')
    } finally {
      setSending(false)
    }
  }

  if (loading)
    return (
      <section className="consultation-panel content-card">
        <p>Carregando professores e estudantes...</p>
      </section>
    )

  if (remote.aguardando)
    return <WaitingApproval tipo={tipo} pedido={remote.aguardando} onCancel={() => void remote.cancelar()} />

  return (
    <section className="consultation-panel content-card">
      <h2>{textos.titulo(consultaId)}</h2>
      <p>{textos.explicacao}</p>

      <div className="consultation-form-grid">
        <label>
          Professor supervisor *
          <select
            value={supervisorId}
            onChange={(event) => {
              setSupervisorId(event.target.value)
              setMessage('')
            }}
            disabled={sending}
          >
            <option value="">Selecione o professor</option>
            {veterinarians.map((vet) => (
              <option key={vet.profileId} value={vet.profileId}>
                {vet.nome} — CRMV {vet.crmv}
              </option>
            ))}
          </select>
        </label>
      </div>

      {textos.comParticipantes && (
        <ParticipantsPicker
          students={students}
          selected={participants}
          onToggle={toggleParticipant}
          disabled={sending}
        />
      )}

      <div className="supervision-options">
        <div className="supervision-option">
          <strong>Professor presente</strong>
          <div className="consultation-form-grid supervision-single-column">
            <label>
              Senha do professor supervisor
              <input
                type="password"
                name="supervisor-authorization"
                autoComplete="off"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void liberarComSenha()
                }}
                placeholder="O professor digita a própria senha aqui"
                disabled={sending}
              />
              <small className="supervision-field-help">
                É a mesma senha que o professor usa para entrar no DiagnoVetis. Você continua logado na sua conta.
              </small>
            </label>
          </div>
          <button className="primary-button" onClick={() => void liberarComSenha()} disabled={sending}>
            {sending ? 'Verificando...' : textos.botaoSenha}
          </button>
        </div>

        <div className="supervision-option">
          <strong>Professor em outro lugar</strong>
          <p className="supervision-option-text">{textos.textoPedidoRemoto}</p>
          <button className="secondary-button" onClick={() => void enviarPedido()} disabled={sending}>
            Enviar pedido ao professor
          </button>
        </div>
      </div>

      {message && (
        <p className="consultation-message" role="status">
          {message}
        </p>
      )}
      {onCancel && (
        <div className="consultation-next">
          <button className="secondary-button" onClick={onCancel} disabled={sending}>
            Voltar
          </button>
        </div>
      )}
    </section>
  )
}
