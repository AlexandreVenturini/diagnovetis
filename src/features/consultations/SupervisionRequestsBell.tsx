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
    new Notification('DiagnoVetis: pedido de liberação', { body: pedido.tipo === 'retificacao' ? `${pedido.alunoNome} pediu para retificar o atendimento nº ${pedido.consultaAlvo}.` : pedido.tipo === 'receita' ? `${pedido.alunoNome} enviou uma receita para aprovação.` : `${pedido.alunoNome} pediu liberação para um atendimento.` })
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
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() => ('Notification' in window ? Notification.permission : 'unsupported'))
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
      stop = observarLiberacoes(`supervisor_id=eq.${data.user.id}`, () => { void carregar() })
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
    if (pedido.tipo === 'receita') {
      setRecusa({ id: pedido.id, motivo: '' })
      setMessage('')
      return
    }
    void responder(pedido, false)
  }

  async function responder(pedido: PedidoLiberacao, aprovar: boolean, motivo: string | null = null) {
    if (!aprovar && pedido.tipo === 'receita' && !motivo?.trim()) {
      setMessage('Informe o motivo da recusa para o estudante corrigir a receita.')
      return
    }
    setBusyId(pedido.id)
    setMessage('')
    try {
      await responderLiberacao(pedido.id, aprovar, motivo)
    } catch (error) {
      const text = (error as Error).message
      setMessage(text.includes('expirado') ? 'Este pedido expirou.' : text.includes('respondido') ? 'Este pedido já foi respondido ou cancelado pelo aluno.' : 'Não foi possível responder o pedido.')
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
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((value) => !value)}
        title="Pedidos de liberação"
        aria-label={`Pedidos de liberação${count ? `: ${count} pendente(s)` : ''}`}
        style={{
          position: 'relative', background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.4)',
          borderRadius: '8px', cursor: 'pointer', padding: '0.35rem 0.6rem', display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: '2px', color: '#fff', lineHeight: 1,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.05em' }}>PEDIDOS</span>
        {count > 0 && (
          <span style={{
            position: 'absolute', top: '-6px', right: '-6px', minWidth: '18px', height: '18px', padding: '0 4px',
            borderRadius: '999px', background: '#dc2626', color: '#fff', fontSize: '0.68rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box',
          }}>{count}</span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 'min(340px, calc(100vw - 32px))', zIndex: 50,
          background: '#fff', color: '#111827', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
          border: '1px solid #e5e7eb', padding: '0.75rem',
        }}>
          <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Pedidos de liberação</strong>
          {count === 0 && <p style={{ margin: '0.25rem 0', color: '#6b7280', fontSize: '0.875rem' }}>Nenhum pedido pendente.</p>}
          <div style={{ display: 'grid', gap: '0.5rem', maxHeight: '320px', overflowY: 'auto' }}>
            {pedidos.map((pedido) => (
              <div key={pedido.id} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '0.6rem 0.75rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: pedido.tipo === 'retificacao' ? '#854d0e' : pedido.tipo === 'receita' ? '#1d4ed8' : '#166534', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {pedido.tipo === 'retificacao'
                    ? `Retificação do atendimento nº ${pedido.consultaAlvo}${pedido.paciente ? ` · ${pedido.paciente}` : ''}`
                    : pedido.tipo === 'receita' ? `Receita para aprovar${pedido.paciente ? ` · ${pedido.paciente}` : ''}` : 'Novo atendimento'}
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{pedido.alunoNome || 'Estudante'}</div>
                <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                  {pedido.alunoMatricula && <>Matrícula {pedido.alunoMatricula} · </>}Pedido às {formatHora(pedido.criadaEm)}
                </div>
                {pedido.receita && (
                  <div style={{ fontSize: '0.78rem', color: '#374151', marginTop: '0.35rem', background: '#f9fafb', borderRadius: '8px', padding: '0.4rem 0.55rem' }}>
                    {pedido.receita.patient.weight && <div>Peso: {pedido.receita.patient.weight} kg</div>}
                    <ol style={{ margin: '0.25rem 0 0', paddingLeft: '1.1rem' }}>
                      {pedido.receita.prescription.items.map((item, index) => (
                        <li key={index}><b>{item.medication}</b> — {item.dose}; {item.route}; {item.frequency}; {item.duration}; qtd: {item.quantity}</li>
                      ))}
                    </ol>
                    {pedido.receita.prescription.instructions && <div style={{ marginTop: '0.25rem' }}>Orientações: {pedido.receita.prescription.instructions}</div>}
                    <button
                      type="button"
                      onClick={() => setViewing(pedido)}
                      style={{ marginTop: '0.45rem', width: '100%', padding: '0.35rem', background: '#fff', color: '#1d4ed8', border: '1.5px solid #93c5fd', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
                    >Ver receita completa ⤢</button>
                  </div>
                )}
                {pedido.participantes.length > 0 && (
                  <div style={{ fontSize: '0.78rem', color: '#4b5563', marginTop: '0.2rem' }}>Participantes: {pedido.participantes.join(', ')}</div>
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
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                  <button
                    onClick={() => void responder(pedido, true)}
                    disabled={busyId === pedido.id}
                    style={{ flex: 1, padding: '0.4rem', background: 'var(--green, #2d6a4f)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}
                  >{pedido.tipo === 'receita' ? 'Aprovar e emitir' : 'Aprovar'}</button>
                  <button
                    onClick={() => pedirRecusa(pedido)}
                    disabled={busyId === pedido.id}
                    style={{ flex: 1, padding: '0.4rem', background: '#fff', color: '#dc2626', border: '1.5px solid #dc2626', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}
                  >Recusar</button>
                </div>
                )}
              </div>
            ))}
          </div>
          {message && <p style={{ margin: '0.5rem 0 0', color: '#991b1b', fontSize: '0.8rem' }}>{message}</p>}
          {permission === 'default' && (
            <button
              onClick={() => void ativarAlertas()}
              style={{ marginTop: '0.6rem', width: '100%', padding: '0.4rem', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: '#374151' }}
            >Ativar alertas do navegador</button>
          )}
        </div>
      )}
      {viewing && viewing.receita && (
        <div
          role="presentation"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setViewing(null) }}
          style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'grid', placeItems: 'center', padding: '16px', background: 'rgb(0 0 0 / 45%)' }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="receita-pedido-titulo"
            style={{ width: 'min(100%, 900px)', maxHeight: 'calc(100vh - 32px)', display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.25rem', borderRadius: '12px', background: '#fff', color: '#111827', boxShadow: '0 20px 55px rgb(0 0 0 / 25%)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div>
                <h3 id="receita-pedido-titulo" style={{ margin: 0 }}>Receita para aprovar{viewing.paciente ? ` · ${viewing.paciente}` : ''}</h3>
                <p style={{ margin: '0.25rem 0 0', color: '#4b5563', fontSize: '0.875rem' }}>
                  Montada por <b>{viewing.alunoNome || 'Estudante'}</b>{viewing.alunoMatricula && ` (matrícula ${viewing.alunoMatricula})`} às {formatHora(viewing.criadaEm)}. Ao aprovar, a receita é emitida com o seu nome e CRMV.
                </p>
              </div>
              <button type="button" aria-label="Fechar" onClick={() => setViewing(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', lineHeight: 1, cursor: 'pointer', color: '#6b7280' }}>×</button>
            </div>
            {receitaHtml(viewing)
              ? <iframe title="Receita enviada para aprovação" sandbox="" srcDoc={receitaHtml(viewing)} style={{ width: '100%', height: '65vh', border: '1px solid #d6e3da', borderRadius: '8px', background: '#fff' }} />
              : <ol style={{ margin: 0 }}>{viewing.receita.prescription.items.map((item, index) => <li key={index}><b>{item.medication}</b> — {item.dose}; {item.route}; {item.frequency}; {item.duration}; qtd: {item.quantity}</li>)}</ol>}
            {recusa?.id === viewing.id ? (
              <RecusaForm
                motivo={recusa.motivo}
                busy={busyId === viewing.id}
                onChange={(motivo) => setRecusa({ id: viewing.id, motivo })}
                onConfirm={() => void responder(viewing, false, recusa.motivo)}
                onCancel={() => setRecusa(null)}
              />
            ) : (
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => setViewing(null)} style={{ padding: '0.5rem 1rem', background: '#fff', color: '#374151', border: '1.5px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Fechar</button>
              <button type="button" disabled={busyId === viewing.id} onClick={() => pedirRecusa(viewing)} style={{ padding: '0.5rem 1rem', background: '#fff', color: '#dc2626', border: '1.5px solid #dc2626', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Recusar</button>
              <button type="button" disabled={busyId === viewing.id} onClick={() => void responder(viewing, true)} style={{ padding: '0.5rem 1rem', background: 'var(--green, #2d6a4f)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Aprovar e emitir</button>
            </div>
            )}
            {message && <p style={{ margin: 0, color: '#991b1b', fontSize: '0.85rem' }}>{message}</p>}
          </section>
        </div>
      )}
    </div>
  )
}

function RecusaForm({ motivo, busy, onChange, onConfirm, onCancel }: { motivo: string; busy: boolean; onChange: (motivo: string) => void; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ display: 'grid', gap: '0.4rem', marginTop: '0.5rem' }}>
      <label style={{ display: 'grid', gap: '0.25rem', fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>
        Motivo da recusa
        <textarea
          autoFocus
          value={motivo}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Ex.: rever a dose do item 2; incluir a duração do tratamento"
          rows={3}
          style={{ width: '100%', boxSizing: 'border-box', padding: '0.45rem 0.55rem', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 400, resize: 'vertical' }}
        />
      </label>
      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} disabled={busy} style={{ padding: '0.4rem 0.8rem', background: '#fff', color: '#374151', border: '1.5px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>Voltar</button>
        <button type="button" onClick={onConfirm} disabled={busy || !motivo.trim()} style={{ padding: '0.4rem 0.8rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', cursor: busy || !motivo.trim() ? 'not-allowed' : 'pointer', opacity: busy || !motivo.trim() ? 0.6 : 1, fontWeight: 600, fontSize: '0.82rem' }}>Confirmar recusa</button>
      </div>
    </div>
  )
}
