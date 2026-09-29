import { useEffect, useState } from 'react'
import { supabase } from '../../services/storage/supabaseClient'
import type { Profile } from '../auth/profile'

type AdminPanelProps = {
  onClose: () => void
}

const CFMV_BUSCA_URL = 'https://siscad.cfmv.gov.br/paginas/busca'

function CrmvInfo({ crmv }: { crmv: string }) {
  const [copied, setCopied] = useState(false)
  const numero = crmv.split('-').pop() ?? crmv

  async function copy() {
    try {
      await navigator.clipboard.writeText(numero)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="admin-crmv">
      <span>CRMV: {crmv}</span>
      <button type="button" className="admin-chip-button" onClick={copy}>
        {copied ? 'Copiado!' : 'Copiar número'}
      </button>
      <a className="admin-chip-button" href={CFMV_BUSCA_URL} target="_blank" rel="noopener noreferrer">
        Consultar no CFMV ↗
      </a>
    </div>
  )
}

function Avatar({ name }: { name: string }) {
  const initials =
    name
      .trim()
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'
  return <div className="admin-avatar">{initials}</div>
}

function RoleBadge({ role }: { role: string | null }) {
  const label = role === 'veterinarian' ? 'Veterinário' : role === 'attendant' ? 'Estudante' : 'Sem perfil'
  return <span className={`pill ${role === 'veterinarian' ? 'pill--success' : 'pill--warning'}`}>{label}</span>
}

function StatusBadge({ suspended }: { suspended: boolean }) {
  return (
    <span className={`pill ${suspended ? 'pill--danger' : 'pill--success'}`}>{suspended ? 'Suspenso' : 'Ativo'}</span>
  )
}

function EmailBadge({ confirmed }: { confirmed: boolean }) {
  return (
    <span className={`pill ${confirmed ? 'pill--success' : 'pill--neutral'}`}>
      {confirmed ? 'E-mail confirmado' : 'E-mail não confirmado'}
    </span>
  )
}

export function AdminPanel({ onClose }: AdminPanelProps) {
  const [tab, setTab] = useState<'pending' | 'users'>('pending')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const pending = profiles.filter((p) => p.status === 'pendente')
  const users = profiles.filter((p) => p.status !== 'pendente')

  useEffect(() => {
    void loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setMessage('')
    const [{ data: auth }, { data, error }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }).returns<Profile[]>(),
    ])
    setCurrentUserId(auth.user?.id ?? null)
    if (error) setMessage('Erro ao carregar usuários: ' + error.message)
    setProfiles(data ?? [])
    setLoading(false)
  }

  async function updateProfile(
    userId: string,
    changes: Partial<Pick<Profile, 'status' | 'is_admin'>>,
    errorLabel: string,
  ) {
    const { error } = await supabase.from('profiles').update(changes).eq('id', userId)
    if (error) {
      setMessage(errorLabel + ': ' + error.message)
      return
    }
    await loadData()
  }

  async function deleteUser(userId: string, errorLabel: string) {
    const { error } = await supabase.rpc('admin_remover_usuario', { p_user_id: userId })
    if (error) {
      setMessage(errorLabel + ': ' + error.message)
      return
    }
    await loadData()
  }

  function approveUser(userId: string) {
    return updateProfile(userId, { status: 'aprovado' }, 'Erro ao aprovar')
  }

  function rejectUser(userId: string) {
    if (!window.confirm('Rejeitar este cadastro? A conta será excluída.')) return
    return deleteUser(userId, 'Erro ao rejeitar')
  }

  function toggleAdmin(userId: string, currentIsAdmin: boolean) {
    return updateProfile(userId, { is_admin: !currentIsAdmin }, 'Erro ao atualizar admin')
  }

  function toggleSuspend(userId: string, suspended: boolean) {
    return updateProfile(userId, { status: suspended ? 'aprovado' : 'suspenso' }, 'Erro ao suspender')
  }

  function removeUser(userId: string) {
    if (!window.confirm('Tem certeza que deseja remover este usuário permanentemente?')) return
    return deleteUser(userId, 'Erro ao remover')
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div>
          <p className="admin-eyebrow">Área restrita</p>
          <h2>Painel Administrativo</h2>
        </div>
        <button className="admin-back-button" onClick={onClose}>
          ← Voltar
        </button>
      </div>

      <div className="admin-tabs">
        {(['pending', 'users'] as const).map((t) => (
          <button key={t} className={`admin-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t === 'pending' && pending.length > 0 && <span className="admin-tab-count">{pending.length}</span>}
            {t === 'pending' ? 'Pendentes' : 'Usuários'}
          </button>
        ))}
      </div>

      {message && <div className="admin-error">{message}</div>}

      {loading ? (
        <div className="admin-empty">
          <div className="admin-empty-icon">⏳</div>
          <p>Carregando usuários...</p>
        </div>
      ) : tab === 'pending' ? (
        pending.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon admin-empty-icon--large">✅</div>
            <p className="admin-empty-title">Nenhum cadastro pendente</p>
            <p className="admin-empty-text">Todos os usuários foram revisados.</p>
          </div>
        ) : (
          <div className="admin-list">
            {pending.map((u) => (
              <div key={u.id} className="admin-user-card">
                <Avatar name={u.name} />
                <div className="admin-user-info">
                  <div className="admin-user-name-row">
                    <span className="admin-user-name">{u.name || '—'}</span>
                    <RoleBadge role={u.role} />
                    <EmailBadge confirmed={u.email_confirmado} />
                  </div>
                  <p className="admin-user-email">{u.email}</p>
                  {u.crmv && <CrmvInfo crmv={u.crmv} />}
                  {u.matricula && <p className="admin-user-detail">Matrícula: {u.matricula}</p>}
                </div>
                <div className="admin-actions">
                  <button className="admin-button admin-button--approve" onClick={() => approveUser(u.id)}>
                    Aprovar
                  </button>
                  <button className="admin-button admin-button--reject" onClick={() => rejectUser(u.id)}>
                    Rejeitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : users.length === 0 ? (
        <div className="admin-empty">
          <p>Nenhum usuário cadastrado.</p>
        </div>
      ) : (
        <div className="admin-list">
          {users.map((u) => {
            const suspended = u.status === 'suspenso'
            return (
              <div key={u.id} className={`admin-user-card${suspended ? ' admin-user-card--suspended' : ''}`}>
                <Avatar name={u.name} />
                <div className="admin-user-info">
                  <div className="admin-user-name-row">
                    <span className="admin-user-name">{u.name || '—'}</span>
                    <RoleBadge role={u.role} />
                    {u.is_admin && <span className="pill pill--info">Admin</span>}
                    <StatusBadge suspended={suspended} />
                  </div>
                  <p className="admin-user-email">{u.email}</p>
                </div>
                {u.id === currentUserId ? (
                  <span className="admin-self">Você</span>
                ) : (
                  <div className="admin-actions admin-actions--compact">
                    <button className="admin-small-button" onClick={() => toggleAdmin(u.id, u.is_admin)}>
                      {u.is_admin ? 'Remover admin' : 'Tornar admin'}
                    </button>
                    <button
                      className={`admin-small-button ${suspended ? 'admin-small-button--reactivate' : 'admin-small-button--suspend'}`}
                      onClick={() => toggleSuspend(u.id, suspended)}
                    >
                      {suspended ? 'Reativar' : 'Suspender'}
                    </button>
                    <button className="admin-small-button admin-small-button--remove" onClick={() => removeUser(u.id)}>
                      Remover
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
