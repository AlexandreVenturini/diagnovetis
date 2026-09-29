import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../../services/storage/supabaseClient'
import { listarPedidosPendentes, observarLiberacoes, responderLiberacao } from './supervision'
import type { PedidoLiberacao } from './supervision'
import { prescriptionHtml } from './prescriptionReport'

function receitaHtml(pedido: PedidoLiberacao) {
  if (!pedido.receita) return ''
  try {
    return prescriptionHtml(pedido.receita.patient, pedido.receita.prescription)
  } catch {
    return ''
  }
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function notificarNavegador(pedido: PedidoLiberacao) {
  if (!('Notification' in window) || Notification.permission !== 'granted' || !document.hidden) return
  try {
    new Notification('DiagnoVetis: pedido de liberação', {
      body:
        pedido.tipo === 'retificacao'
          ? `${pedido.alunoNome} pediu para retificar o atendimento nº ${pedido.consultaAlvo}.`
          : pedido.tipo === 'receita'
            ? `${pedido.alunoNome} enviou uma receita para aprovação.`
            : pedido.tipo === 'obito'
              ? `${pedido.alunoNome} enviou um registro de óbito para aprovação.`
              : `${pedido.alunoNome} pediu liberação para um atendimento.`,
    })
  } catch {
    return
  }
}

export function SupervisionRequestsBell() {
  const [pedidos, setPedidos] = useState<PedidoLiberacao[]>([])
  const [open, setOpen] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [viewing, setViewing] = useState<PedidoLiberacao | null>(null)
  const [recusa, setRecusa] = useState<{ id: string; motivo: string } | null>(null)
  const [message, setMessage] = useState('')
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    'Notification' in window ? Notification.permission : 'unsupported',
  )
  const knownIds = useRef<Set<string> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const carregar = useCallback(async () => {
    const lista = await listarPedidosPendentes().catch(() => null)
    if (!lista) return
    if (knownIds.current) {
      lista.filter((pedido) => !knownIds.current?.has(pedido.id)).forEach(notificarNavegador)
    }
    knownIds.current = new Set(lista.map((pedido) => pedido.id))
    setPedidos(lista)
  }, [])

  useEffect(() => {
    let stop: (() => void) | undefined
    let active = true
    supabase.auth.getUser().then(({ data }) => {
      if (!active || !data.user) return
      void carregar()
      stop = observarLiberacoes(`supervisor_id=eq.${data.user.id}`, () => {
        void carregar()
      })
    })
    return () => {
      active = false
      stop?.()
    }
  }, [carregar])

  useEffect(() => {
    if (!open) return
    function fechar(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', fechar)
    return () => document.removeEventListener('mousedown', fechar)
  }, [open])

  function pedirRecusa(pedido: PedidoLiberacao) {
    if (pedido.tipo === 'receita' || pedido.tipo === 'obito') {
      setRecusa({ id: pedido.id, motivo: '' })
      setMessage('')
      return
    }
    void responder(pedido, false)
  }

  async function responder(pedido: PedidoLiberacao, aprovar: boolean, motivo: string | null = null) {
    if (!aprovar && (pedido.tipo === 'receita' || pedido.tipo === 'obito') && !motivo?.trim()) {
      setMessage('Informe o motivo da recusa para o estudante corrigir.')
      return
    }
    setBusyId(pedido.id)
    setMessage('')
    try {
      await responderLiberacao(pedido.id, aprovar, motivo)
    } catch (error) {
      const text = (error as Error).message
      setMessage(
        text.includes('expirado')
          ? 'Este pedido expirou.'
          : text.includes('respondido')
            ? 'Este pedido já foi respondido ou cancelado pelo aluno.'
            : 'Não foi possível responder o pedido.',
      )
    } finally {
      setBusyId(null)
      setViewing(null)
      setRecusa(null)
      await carregar()
    }
  }

  async function ativarAlertas() {
    if (!('Notification' in window)) return
    setPermission(await Notification.requestPermission())
  }

  const count = pedidos.length

  return (
    <div ref={containerRef} className="bell">
      <button
        className="header-action"
        onClick={() => setOpen((value) => !value)}
        title="Pedidos de liberação"
        aria-label={`Pedidos de liberação${count ? `: ${count} pendente(s)` : ''}`}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        <span className="header-action-label">PEDIDOS</span>
        {count > 0 && <span className="header-action-count">{count}</span>}
      </button>

      {open && (
        <div className="bell-dropdown">
          <strong className="bell-title">Pedidos de liberação</strong>
          {count === 0 && <p className="bell-empty">Nenhum pedido pendente.</p>}
          <div className="bell-list">
            {pedidos.map((pedido) => (
              <div key={pedido.id} className="bell-request">
                <div className={`bell-request-type bell-request-type--${pedido.tipo}`}>
                  {pedido.tipo === 'retificacao'
                    ? `Retificação do atendimento nº ${pedido.consultaAlvo}${pedido.paciente ? ` · ${pedido.paciente}` : ''}`
                    : pedido.tipo === 'receita'
                      ? `Receita para aprovar${pedido.paciente ? ` · ${pedido.paciente}` : ''}`
                      : pedido.tipo === 'obito'
                        ? `Registro de óbito${pedido.paciente ? ` · ${pedido.paciente}` : ''}`
                        : 'Novo atendimento'}
                </div>
                <div className="bell-request-student">{pedido.alunoNome || 'Estudante'}</div>
                <div className="bell-request-meta">
                  {pedido.alunoMatricula && <>Matrícula {pedido.alunoMatricula} · </>}Pedido às{' '}
                  {formatHora(pedido.criadaEm)}
                </div>
                {pedido.receita && (
                  <div className="bell-request-details">
                    {pedido.receita.patient.weight && <div>Peso: {pedido.receita.patient.weight} kg</div>}
                    <ol className="bell-request-items">
                      {pedido.receita.prescription.items.map((item, index) => (
                        <li key={index}>
                          <b>{item.medication}</b> — {item.dose}; {item.route}; {item.frequency}; {item.duration}; qtd:{' '}
                          {item.quantity}
                        </li>
                      ))}
                    </ol>
                    {pedido.receita.prescription.instructions && (
                      <div className="bell-request-note">Orientações: {pedido.receita.prescription.instructions}</div>
                    )}
                    <button type="button" className="bell-view-button" onClick={() => setViewing(pedido)}>
                      Ver receita completa ⤢
                    </button>
                  </div>
                )}
                {pedido.obito && (
                  <div className="bell-request-details bell-request-details--grid">
                    <div>
                      <b>Data e hora:</b>{' '}
                      {new Date(pedido.obito.data_hora).toLocaleString('pt-BR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </div>
                    <div>
                      <b>Circunstâncias:</b> {pedido.obito.circunstancias}
                    </div>
                    {pedido.obito.causa_provavel && (
                      <div>
                        <b>Causa provável:</b> {pedido.obito.causa_provavel}
                      </div>
                    )}
                    <div>
                      <b>Eutanásia:</b> {pedido.obito.eutanasia ? 'Sim' : 'Não'} · <b>Reanimação:</b>{' '}
                      {pedido.obito.houve_reanimacao ? 'Sim' : 'Não'} · <b>Necropsia:</b>{' '}
                      {pedido.obito.necropsia ? 'Sim' : 'Não'}
                    </div>
                    <div>
                      <b>Responsável comunicado:</b>{' '}
                      {pedido.obito.comunicado_responsavel
                        ? `Sim${pedido.obito.comunicacao_detalhes ? ` — ${pedido.obito.comunicacao_detalhes}` : ''}`
                        : 'Não'}
                    </div>
                    <div>
                      <b>Destinação do corpo:</b> {pedido.obito.destino_corpo}
                    </div>
                  </div>
                )}
                {pedido.participantes.length > 0 && (
                  <div className="bell-request-participants">Participantes: {pedido.participantes.join(', ')}</div>
                )}
                {recusa?.id === pedido.id ? (
                  <RecusaForm
                    motivo={recusa.motivo}
                    busy={busyId === pedido.id}
                    onChange={(motivo) => setRecusa({ id: pedido.id, motivo })}
                    onConfirm={() => void responder(pedido, false, recusa.motivo)}
                    onCancel={() => setRecusa(null)}
                  />
                ) : (
                  <div className="bell-request-actions">
                    <button
                      className="bell-button bell-button--approve"
                      onClick={() => void responder(pedido, true)}
                      disabled={busyId === pedido.id}
                    >
                      {pedido.tipo === 'receita'
                        ? 'Aprovar e emitir'
                        : pedido.tipo === 'obito'
                          ? 'Aprovar e registrar'
                          : 'Aprovar'}
                    </button>
                    <button
                      className="bell-button bell-button--reject"
                      onClick={() => pedirRecusa(pedido)}
                      disabled={busyId === pedido.id}
                    >
                      Recusar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {message && <p className="bell-error">{message}</p>}
          {permission === 'default' && (
            <button className="bell-alerts-button" onClick={() => void ativarAlertas()}>
              Ativar alertas do navegador
            </button>
          )}
        </div>
      )}
      {viewing && viewing.receita && (
        <div
          role="presentation"
          className="bell-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setViewing(null)
          }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="receita-pedido-titulo" className="bell-modal">
            <div className="bell-modal-header">
              <div>
                <h3 id="receita-pedido-titulo">
                  Receita para aprovar{viewing.paciente ? ` · ${viewing.paciente}` : ''}
                </h3>
                <p>
                  Montada por <b>{viewing.alunoNome || 'Estudante'}</b>
                  {viewing.alunoMatricula && ` (matrícula ${viewing.alunoMatricula})`} às {formatHora(viewing.criadaEm)}
                  . Ao aprovar, a receita é emitida com o seu nome e CRMV.
                </p>
              </div>
              <button type="button" className="bell-modal-close" aria-label="Fechar" onClick={() => setViewing(null)}>
                ×
              </button>
            </div>
            {receitaHtml(viewing) ? (
              <iframe
                className="bell-modal-preview"
                title="Receita enviada para aprovação"
                sandbox=""
                srcDoc={receitaHtml(viewing)}
              />
            ) : (
              <ol className="bell-modal-items">
                {viewing.receita.prescription.items.map((item, index) => (
                  <li key={index}>
                    <b>{item.medication}</b> — {item.dose}; {item.route}; {item.frequency}; {item.duration}; qtd:{' '}
                    {item.quantity}
                  </li>
                ))}
              </ol>
            )}
            {recusa?.id === viewing.id ? (
              <RecusaForm
                motivo={recusa.motivo}
                busy={busyId === viewing.id}
                onChange={(motivo) => setRecusa({ id: viewing.id, motivo })}
                onConfirm={() => void responder(viewing, false, recusa.motivo)}
                onCancel={() => setRecusa(null)}
              />
            ) : (
              <div className="bell-modal-actions">
                <button type="button" className="bell-modal-button" onClick={() => setViewing(null)}>
                  Fechar
                </button>
                <button
                  type="button"
                  className="bell-modal-button bell-modal-button--reject"
                  disabled={busyId === viewing.id}
                  onClick={() => pedirRecusa(viewing)}
                >
                  Recusar
                </button>
                <button
                  type="button"
                  className="bell-modal-button bell-modal-button--approve"
                  disabled={busyId === viewing.id}
                  onClick={() => void responder(viewing, true)}
                >
                  Aprovar e emitir
                </button>
              </div>
            )}
            {message && <p className="bell-error bell-error--modal">{message}</p>}
          </section>
        </div>
      )}
    </div>
  )
}

function RecusaForm({
  motivo,
  busy,
  onChange,
  onConfirm,
  onCancel,
}: {
  motivo: string
  busy: boolean
  onChange: (motivo: string) => void
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="refusal-form">
      <label>
        Motivo da recusa
        <textarea
          autoFocus
          value={motivo}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Ex.: rever a dose do item 2; incluir a duração do tratamento"
          rows={3}
        />
      </label>
      <div className="refusal-form-actions">
        <button type="button" className="refusal-button" onClick={onCancel} disabled={busy}>
          Voltar
        </button>
        <button
          type="button"
          className="refusal-button refusal-button--confirm"
          onClick={onConfirm}
          disabled={busy || !motivo.trim()}
        >
          Confirmar recusa
        </button>
      </div>
    </div>
  )
}
