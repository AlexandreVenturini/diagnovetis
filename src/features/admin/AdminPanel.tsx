import { useState } from 'react'
import { PendingUserCard, UserCard } from './UserCards'
import { useAdminUsers } from './useAdminUsers'

type AdminPanelProps = {
  onClose: () => void
}

type Tab = 'pending' | 'users'

export function AdminPanel({ onClose }: AdminPanelProps) {
  const [tab, setTab] = useState<Tab>('pending')
  const admin = useAdminUsers()
  const { pending, users } = admin

  function renderContent() {
    if (admin.loading)
      return (
        <div className="admin-empty">
          <div className="admin-empty-icon">⏳</div>
          <p>Carregando usuários...</p>
        </div>
      )
    if (tab === 'pending')
      return pending.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty-icon admin-empty-icon--large">✅</div>
          <p className="admin-empty-title">Nenhum cadastro pendente</p>
          <p className="admin-empty-text">Todos os usuários foram revisados.</p>
        </div>
      ) : (
        <div className="admin-list">
          {pending.map((user) => (
            <PendingUserCard key={user.id} user={user} admin={admin} />
          ))}
        </div>
      )
    return users.length === 0 ? (
      <div className="admin-empty">
        <p>Nenhum usuário cadastrado.</p>
      </div>
    ) : (
      <div className="admin-list">
        {users.map((user) => (
          <UserCard key={user.id} user={user} admin={admin} />
        ))}
      </div>
    )
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
        {(['pending', 'users'] as const).map((item) => (
          <button key={item} className={`admin-tab${tab === item ? ' active' : ''}`} onClick={() => setTab(item)}>
            {item === 'pending' && pending.length > 0 && <span className="admin-tab-count">{pending.length}</span>}
            {item === 'pending' ? 'Pendentes' : 'Usuários'}
          </button>
        ))}
      </div>

      {admin.message && <div className="admin-error">{admin.message}</div>}

      {renderContent()}
    </div>
  )
}
