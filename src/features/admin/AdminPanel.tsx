import { useEffect, useState } from 'react'
import { supabase } from '../../services/storage/supabaseClient'

type PendingUser = {
  id: string
  email: string
  name: string
  role: string
  crmv?: string
  createdAt: string
}

type ActiveUser = {
  id: string
  email: string
  name: string
  role: string
  isAdmin: boolean
  suspended: boolean
}

type AdminPanelProps = {
  onClose: () => void
}

function Avatar({ name }: { name: string }) {
  const initials = name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
  return (
    <div style={{
      width: 36, height: 36, borderRadius: '50%', background: 'var(--green, #2d6a4f)',
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: '0.8rem', flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const label = role === 'veterinarian' ? 'Veterinário' : role === 'attendant' ? 'Estudante' : role
  const color = role === 'veterinarian' ? '#166534' : '#854d0e'
  const bg = role === 'veterinarian' ? '#dcfce7' : '#fef9c3'
  return (
    <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.55rem', borderRadius: '999px', background: bg, color }}>
      {label}
    </span>
  )
}

function StatusBadge({ suspended }: { suspended: boolean }) {
  return (
    <span style={{
      fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.55rem', borderRadius: '999px',
      background: suspended ? '#fee2e2' : '#dcfce7', color: suspended ? '#991b1b' : '#166534',
    }}>
      {suspended ? 'Suspenso' : 'Ativo'}
    </span>
  )
}

export function AdminPanel({ onClose }: AdminPanelProps) {
  const [tab, setTab] = useState<'pending' | 'users'>('pending')
  const [pending, setPending] = useState<PendingUser[]>([])
  const [users, setUsers] = useState<ActiveUser[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => { void loadData() }, [])

  async function loadData() {
    setLoading(true)
    setMessage('')
    const { data, error } = await supabase.auth.admin.listUsers()
    if (error || !data) {
      setPending([])
      setUsers([])
      setLoading(false)
      return
    }
    const all = data.users
    setPending(all
      .filter(u => !u.email_confirmed_at && u.user_metadata?.role)
      .map(u => ({
        id: u.id, email: u.email ?? '',
        name: String(u.user_metadata?.name ?? ''),
        role: String(u.user_metadata?.role ?? ''),
        crmv: u.user_metadata?.crmv as string | undefined,
        createdAt: u.created_at,
      }))
    )
    setUsers(all
      .filter(u => u.email_confirmed_at)
      .map(u => ({
        id: u.id, email: u.email ?? '',
        name: String(u.user_metadata?.name ?? ''),
        role: String(u.user_metadata?.role ?? ''),
        isAdmin: u.user_metadata?.is_admin === true,
        suspended: u.banned_until != null,
      }))
    )
    setLoading(false)
  }

  async function approveUser(userId: string) {
    const { error } = await supabase.auth.admin.updateUserById(userId, { email_confirm: true })
    if (error) { setMessage('Erro ao aprovar: ' + error.message); return }
    await loadData()
  }

  async function rejectUser(userId: string) {
    const { error } = await supabase.auth.admin.deleteUser(userId)
    if (error) { setMessage('Erro ao rejeitar: ' + error.message); return }
    await loadData()
  }

  async function toggleAdmin(userId: string, currentIsAdmin: boolean) {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { is_admin: !currentIsAdmin },
    })
    if (error) { setMessage('Erro ao atualizar admin: ' + error.message); return }
    await loadData()
  }

  async function toggleSuspend(userId: string, suspended: boolean) {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      ban_duration: suspended ? 'none' : '876000h',
    })
    if (error) { setMessage('Erro ao suspender: ' + error.message); return }
    await loadData()
  }

  async function removeUser(userId: string) {
    if (!window.confirm('Tem certeza que deseja remover este usuário permanentemente?')) return
    const { error } = await supabase.auth.admin.deleteUser(userId)
    if (error) { setMessage('Erro ao remover: ' + error.message); return }
    await loadData()
  }

  return (
    <div style={{ minHeight: '80vh' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid #e5e7eb',
      }}>
        <div>
          <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: 'var(--green, #2d6a4f)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Área restrita
          </p>
          <h2 style={{ margin: '0.15rem 0 0', fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
            Painel Administrativo
          </h2>
        </div>
        <button
          onClick={onClose}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem',
            background: 'none', border: '1.5px solid #d1d5db', borderRadius: '8px',
            cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: '#374151',
          }}
        >
          ← Voltar
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem' }}>
        {(['pending', 'users'] as const).map(t => {
          const active = tab === t
          const label = t === 'pending'
            ? `Pendentes${pending.length > 0 ? ` (${pending.length})` : ''}`
            : 'Usuários ativos'
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '0.55rem 1.25rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600,
                fontSize: '0.875rem', transition: 'all 0.15s',
                background: active ? 'var(--green, #2d6a4f)' : '#f3f4f6',
                color: active ? '#fff' : '#6b7280',
                border: active ? '2px solid var(--green, #2d6a4f)' : '2px solid transparent',
              }}
            >
              {t === 'pending' && pending.length > 0 && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 18, height: 18, borderRadius: '50%', background: active ? '#fff' : '#dc2626',
                  color: active ? 'var(--green, #2d6a4f)' : '#fff', fontSize: '0.65rem', fontWeight: 700,
                  marginRight: '0.4rem',
                }}>{pending.length}</span>
              )}
              {label.replace(/ \(\d+\)/, '')}
            </button>
          )
        })}
      </div>

      {message && (
        <div style={{
          padding: '0.75rem 1rem', background: '#fee2e2', border: '1px solid #fca5a5',
          borderRadius: '8px', color: '#991b1b', marginBottom: '1rem', fontSize: '0.875rem',
        }}>
          {message}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
          <p>Carregando usuários...</p>
        </div>
      ) : tab === 'pending' ? (
        pending.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✅</div>
            <p style={{ fontWeight: 600, color: '#374151' }}>Nenhum cadastro pendente</p>
            <p style={{ fontSize: '0.85rem' }}>Todos os usuários foram revisados.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pending.map(u => (
              <div key={u.id} style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '12px',
                padding: '1rem 1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}>
                <Avatar name={u.name} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>{u.name || '—'}</span>
                    <RoleBadge role={u.role} />
                  </div>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#6b7280' }}>{u.email}</p>
                  {u.crmv && <p style={{ margin: '0.1rem 0 0', fontSize: '0.78rem', color: '#9ca3af' }}>CRMV: {u.crmv}</p>}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <button
                    onClick={() => approveUser(u.id)}
                    style={{
                      padding: '0.45rem 1rem', background: 'var(--green, #2d6a4f)', color: '#fff',
                      border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                    }}
                  >
                    Aprovar
                  </button>
                  <button
                    onClick={() => rejectUser(u.id)}
                    style={{
                      padding: '0.45rem 1rem', background: '#fff', color: '#dc2626',
                      border: '1.5px solid #dc2626', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                    }}
                  >
                    Rejeitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
            <p>Nenhum usuário ativo.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {users.map(u => (
              <div key={u.id} style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '12px',
                padding: '1rem 1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                opacity: u.suspended ? 0.6 : 1,
              }}>
                <Avatar name={u.name} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>{u.name || '—'}</span>
                    <RoleBadge role={u.role} />
                    {u.isAdmin && (
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '999px', background: '#e0e7ff', color: '#3730a3' }}>
                        Admin
                      </span>
                    )}
                    <StatusBadge suspended={u.suspended} />
                  </div>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#6b7280' }}>{u.email}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => toggleAdmin(u.id, u.isAdmin)}
                    style={{
                      padding: '0.35rem 0.8rem', background: '#f3f4f6', color: '#374151',
                      border: '1.5px solid #d1d5db', borderRadius: '7px', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem',
                    }}
                  >
                    {u.isAdmin ? 'Remover admin' : 'Tornar admin'}
                  </button>
                  <button
                    onClick={() => toggleSuspend(u.id, u.suspended)}
                    style={{
                      padding: '0.35rem 0.8rem',
                      background: u.suspended ? '#dcfce7' : '#fef9c3',
                      color: u.suspended ? '#166534' : '#854d0e',
                      border: `1.5px solid ${u.suspended ? '#86efac' : '#fde68a'}`,
                      borderRadius: '7px', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem',
                    }}
                  >
                    {u.suspended ? 'Reativar' : 'Suspender'}
                  </button>
                  <button
                    onClick={() => removeUser(u.id)}
                    style={{
                      padding: '0.35rem 0.8rem', background: '#fff', color: '#dc2626',
                      border: '1.5px solid #fca5a5', borderRadius: '7px', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem',
                    }}
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
