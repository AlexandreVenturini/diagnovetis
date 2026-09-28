import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../../services/storage/supabaseClient'
import { listarPedidosPendentes, observarLiberacoes, responderLiberacao } from './supervision'
import type { PedidoLiberacao } from './supervision'

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function notificarNavegador(pedido: PedidoLiberacao) {
  if (!('Notification' in window) || Notification.permission !== 'granted' || !document.hidden) return
  try {
    new Notification('DiagnoVetis: pedido de liberação', { body: pedido.tipo === 'retificacao' ? `${pedido.alunoNome} pediu para retificar o atendimento nº ${pedido.consultaAlvo}.` : `${pedido.alunoNome} pediu liberação para um atendimento.` })
  } catch {
    return
  }
}

export function SupervisionRequestsBell() {
  const [pedidos, setPedidos] = useState<PedidoLiberacao[]>([])
  const [open, setOpen] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
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

  async function responder(pedido: PedidoLiberacao, aprovar: boolean) {
    setBusyId(pedido.id)
    setMessage('')
    try {
      await responderLiberacao(pedido.id, aprovar)
    } catch (error) {
      const text = (error as Error).message
      setMessage(text.includes('expirado') ? 'Este pedido expirou.' : text.includes('respondido') ? 'Este pedido já foi respondido ou cancelado pelo aluno.' : 'Não foi possível responder o pedido.')
    } finally {
      setBusyId(null)
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
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: pedido.tipo === 'retificacao' ? '#854d0e' : '#166534', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {pedido.tipo === 'retificacao' ? `Retificação do atendimento nº ${pedido.consultaAlvo}${pedido.paciente ? ` · ${pedido.paciente}` : ''}` : 'Novo atendimento'}
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{pedido.alunoNome || 'Estudante'}</div>
                <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                  {pedido.alunoMatricula && <>Matrícula {pedido.alunoMatricula} · </>}Pedido às {formatHora(pedido.criadaEm)}
                </div>
                {pedido.participantes.length > 0 && (
                  <div style={{ fontSize: '0.78rem', color: '#4b5563', marginTop: '0.2rem' }}>Participantes: {pedido.participantes.join(', ')}</div>
                )}
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                  <button
                    onClick={() => void responder(pedido, true)}
                    disabled={busyId === pedido.id}
                    style={{ flex: 1, padding: '0.4rem', background: 'var(--green, #2d6a4f)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}
                  >Aprovar</button>
                  <button
                    onClick={() => void responder(pedido, false)}
                    disabled={busyId === pedido.id}
                    style={{ flex: 1, padding: '0.4rem', background: '#fff', color: '#dc2626', border: '1.5px solid #dc2626', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}
                  >Recusar</button>
                </div>
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
    </div>
  )
}
