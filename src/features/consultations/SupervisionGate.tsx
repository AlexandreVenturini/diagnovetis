import { useEffect, useMemo, useRef, useState } from 'react'
import {
  LIBERACAO_EXPIRA_MS,
  buscarStatusLiberacao,
  cancelarLiberacao,
  liberarAtendimento,
  listarEstudantes,
  listarVeterinarios,
  observarLiberacoes,
  solicitarLiberacao,
} from './supervision'
import type { Liberacao, ObitoParaAprovar, ReceitaParaAprovar, StudentOption, VeterinarianOption } from './supervision'

type SupervisionGateProps = {
  onLiberado: (liberacao: Liberacao) => void
  consultaId?: number
  receita?: ReceitaParaAprovar
  obito?: ObitoParaAprovar
  onCancel?: () => void
  onRecusado?: (mensagem: string) => void
}

type PedidoAguardando = {
  id: string
  supervisor: VeterinarianOption
  participantes: StudentOption[]
  enviadoEm: number
}

const optionCardStyle = {
  border: '1px solid #e5e7eb',
  borderRadius: '10px',
  padding: '1rem',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '0.75rem',
}

export function SupervisionGate({
  onLiberado,
  consultaId,
  receita,
  obito,
  onCancel,
  onRecusado,
}: SupervisionGateProps) {
  const retificacao = consultaId !== undefined
  const paraReceita = receita !== undefined
  const paraObito = obito !== undefined
  const semParticipantes = retificacao || paraReceita || paraObito
  const alvo = paraObito
    ? 'o registro de óbito'
    : paraReceita
      ? 'a receita'
      : retificacao
        ? 'a retificação'
        : 'o atendimento'
  const [veterinarians, setVeterinarians] = useState<VeterinarianOption[]>([])
  const [students, setStudents] = useState<StudentOption[]>([])
  const [loading, setLoading] = useState(true)
  const [supervisorId, setSupervisorId] = useState('')
  const [participants, setParticipants] = useState<string[]>([])
  const [studentQuery, setStudentQuery] = useState('')
  const [password, setPassword] = useState('')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [aguardando, setAguardando] = useState<PedidoAguardando | null>(null)
  const onLiberadoRef = useRef(onLiberado)
  const onRecusadoRef = useRef(onRecusado)

  useEffect(() => {
    onLiberadoRef.current = onLiberado
    onRecusadoRef.current = onRecusado
  }, [onLiberado, onRecusado])

  useEffect(() => {
    let active = true
    Promise.all([listarVeterinarios(), listarEstudantes()])
      .then(([vets, studs]) => {
        if (!active) return
        setVeterinarians(vets)
        setStudents(studs)
      })
      .catch(() => {
        if (active) setMessage('Não foi possível carregar os professores e estudantes. Tente novamente.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!aguardando) return
    let active = true
    const pedido = aguardando

    async function verificar() {
      if (Date.now() - pedido.enviadoEm > LIBERACAO_EXPIRA_MS) {
        await cancelarLiberacao(pedido.id).catch(() => {})
        if (!active) return
        setAguardando(null)
        setMessage('O pedido expirou sem resposta. Envie um novo pedido ou use a senha do professor.')
        return
      }
      const situacao = await buscarStatusLiberacao(pedido.id).catch(() => null)
      if (!active || !situacao) return
      const concluidoPeloProfessor =
        situacao.status === 'finalizada' && ((paraReceita && situacao.prescricaoId) || (paraObito && situacao.obitoId))
      if (situacao.status === 'aberta' || concluidoPeloProfessor) {
        onLiberadoRef.current({ id: pedido.id, supervisor: pedido.supervisor, participantes: pedido.participantes })
      } else if (situacao.status === 'recusada') {
        const mensagem = `${pedido.supervisor.nome} recusou ${paraReceita || paraObito ? alvo : 'o pedido'}${situacao.motivoRecusa ? `: ${situacao.motivoRecusa}` : '.'}`
        setAguardando(null)
        if (onRecusadoRef.current) onRecusadoRef.current(mensagem)
        else setMessage(mensagem)
      } else if (situacao.status === 'cancelada' || situacao.status === 'finalizada') {
        setAguardando(null)
      }
    }

    const stop = observarLiberacoes(`id=eq.${pedido.id}`, () => {
      void verificar()
    })
    return () => {
      active = false
      stop()
    }
  }, [aguardando, paraReceita, paraObito, alvo])

  const filteredStudents = useMemo(() => {
    const query = studentQuery.trim().toLocaleLowerCase('pt-BR')
    return students.filter((student) =>
      `${student.nome} ${student.matricula}`.toLocaleLowerCase('pt-BR').includes(query),
    )
  }, [students, studentQuery])

  const supervisor = veterinarians.find((vet) => vet.profileId === supervisorId)
  const selectedStudents = students.filter((student) => participants.includes(student.profileId))

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
      const id = await liberarAtendimento(
        supervisor.profileId,
        password,
        semParticipantes ? [] : participants,
        consultaId ?? null,
        receita ?? null,
        obito ?? null,
      )
      setPassword('')
      if (!id) {
        setMessage('Senha incorreta. Peça ao professor para digitar novamente.')
        return
      }
      onLiberado({ id, supervisor, participantes: selectedStudents })
    } catch (error) {
      setPassword('')
      const text = (error as Error).message
      setMessage(text.includes('tentativas') ? text : `Não foi possível liberar ${alvo}. Tente novamente.`)
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
      const id = await solicitarLiberacao(
        supervisor.profileId,
        semParticipantes ? [] : participants,
        consultaId ?? null,
        receita ?? null,
        obito ?? null,
      )
      setAguardando({ id, supervisor, participantes: selectedStudents, enviadoEm: Date.now() })
    } catch {
      setMessage('Não foi possível enviar o pedido ao professor. Tente novamente.')
    } finally {
      setSending(false)
    }
  }

  async function cancelarPedido() {
    if (!aguardando) return
    await cancelarLiberacao(aguardando.id).catch(() => {})
    setAguardando(null)
  }

  if (loading)
    return (
      <section className="consultation-panel content-card">
        <p>Carregando professores e estudantes...</p>
      </section>
    )

  if (aguardando) {
    return (
      <section className="consultation-panel content-card">
        <h2>
          {paraObito
            ? 'Aguardando aprovação do registro de óbito'
            : paraReceita
              ? 'Aguardando aprovação da receita'
              : retificacao
                ? 'Aguardando aprovação da retificação'
                : 'Aguardando aprovação'}
        </h2>
        <p>
          O pedido foi enviado para <strong>{aguardando.supervisor.nome}</strong>. Ele aparece no sino no topo da tela
          do professor, que pode aprovar pelo celular ou computador.
        </p>
        {aguardando.participantes.length > 0 && (
          <p>Participantes: {aguardando.participantes.map((p) => p.nome).join(', ')}</p>
        )}
        <p style={{ color: '#6b7280' }}>
          Esta tela {paraObito ? 'conclui o registro' : paraReceita ? 'emite a receita' : `abre ${alvo}`} sozinha assim
          que o professor aprovar. O pedido expira em 30 minutos.
        </p>
        <div className="consultation-next">
          <button className="secondary-button" onClick={() => void cancelarPedido()}>
            Cancelar pedido
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="consultation-panel content-card">
      <h2>
        {paraObito
          ? 'Aprovação do registro de óbito'
          : paraReceita
            ? 'Aprovação da receita'
            : retificacao
              ? `Liberação da retificação do atendimento nº ${consultaId}`
              : 'Liberação do atendimento'}
      </h2>
      <p>
        {paraObito
          ? 'O registro de óbito feito por estudantes precisa da aprovação de um médico-veterinário, que confere os dados antes de concluir.'
          : paraReceita
            ? 'Receitas montadas por estudantes só são emitidas com a aprovação de um médico-veterinário. A receita sai no nome e com o CRMV de quem aprovar.'
            : retificacao
              ? 'Alterações feitas por estudantes em atendimentos finalizados precisam da autorização de um professor. Escolha o professor, que libera a retificação de uma das duas formas abaixo.'
              : 'Antes de começar, escolha o professor responsável pela supervisão e os colegas que vão participar. Depois, o professor libera o atendimento de uma das duas formas abaixo.'}
      </p>

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

      {!semParticipantes && (
        <fieldset
          style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.75rem 1rem', margin: '1rem 0' }}
          disabled={sending}
        >
          <legend style={{ padding: '0 0.35rem', fontWeight: 600 }}>
            Alunos participantes ({participants.length})
          </legend>
          {students.length === 0 ? (
            <p style={{ margin: 0, color: '#6b7280' }}>Nenhum outro estudante cadastrado.</p>
          ) : (
            <>
              <input
                value={studentQuery}
                onChange={(event) => setStudentQuery(event.target.value)}
                placeholder="Buscar por nome ou matrícula"
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 15px',
                  marginBottom: '0.5rem',
                  border: '1px solid #d1d1d1',
                  borderRadius: '9px',
                  fontSize: '14px',
                  outline: 0,
                }}
              />
              <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'grid', gap: '0.35rem' }}>
                {filteredStudents.map((student) => (
                  <label
                    key={student.profileId}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 400 }}
                  >
                    <input
                      type="checkbox"
                      checked={participants.includes(student.profileId)}
                      onChange={() => toggleParticipant(student.profileId)}
                      style={{ width: 'auto' }}
                    />
                    {student.nome}
                    {student.matricula && <small style={{ color: '#6b7280' }}>· {student.matricula}</small>}
                  </label>
                ))}
                {filteredStudents.length === 0 && (
                  <p style={{ margin: 0, color: '#6b7280' }}>Nenhum estudante encontrado.</p>
                )}
              </div>
            </>
          )}
        </fieldset>
      )}

      <div
        style={{
          display: 'grid',
          marginTop: '1rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1rem',
        }}
      >
        <div style={optionCardStyle}>
          <strong>Professor presente</strong>
          <div className="consultation-form-grid" style={{ gridTemplateColumns: '1fr' }}>
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
              <small style={{ fontWeight: 400, color: '#6b7280' }}>
                É a mesma senha que o professor usa para entrar no DiagnoVetis. Você continua logado na sua conta.
              </small>
            </label>
          </div>
          <button className="primary-button" onClick={() => void liberarComSenha()} disabled={sending}>
            {sending ? 'Verificando...' : paraReceita || paraObito ? 'Aprovar com senha' : 'Liberar com senha'}
          </button>
        </div>

        <div style={optionCardStyle}>
          <strong>Professor em outro lugar</strong>
          <p style={{ margin: 0, color: '#4b5563' }}>
            {paraObito
              ? 'Envia o registro para a conta do professor. Ele confere os dados e aprova pelo sino no topo da tela, no celular ou computador.'
              : paraReceita
                ? 'Envia a receita para a conta do professor. Ele revisa os medicamentos e aprova pelo sino no topo da tela, no celular ou computador.'
                : 'Envia um pedido para a conta do professor. Ele aprova pelo sino no topo da tela, no celular ou computador, sem precisar digitar a senha aqui.'}
          </p>
          <button
            className="secondary-button"
            onClick={() => void enviarPedido()}
            disabled={sending}
            style={{ marginTop: 'auto' }}
          >
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
