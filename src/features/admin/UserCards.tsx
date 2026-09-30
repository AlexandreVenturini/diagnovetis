import type { Profile } from '../auth/profile'
import { Avatar, CrmvInfo, EmailBadge, RoleBadge, StatusBadge } from './UserBadges'
import type { AdminUsers } from './useAdminUsers'

export function PendingUserCard({ user, admin }: { user: Profile; admin: AdminUsers }) {
  return (
    <div className="admin-user-card">
      <Avatar name={user.name} />
      <div className="admin-user-info">
        <div className="admin-user-name-row">
          <span className="admin-user-name">{user.name || '—'}</span>
          <RoleBadge role={user.role} />
          <EmailBadge confirmed={user.email_confirmado} />
        </div>
        <p className="admin-user-email">{user.email}</p>
        {user.crmv && <CrmvInfo crmv={user.crmv} />}
        {user.matricula && <p className="admin-user-detail">Matrícula: {user.matricula}</p>}
      </div>
      <div className="admin-actions">
        <button className="admin-button admin-button--approve" onClick={() => admin.approve(user.id)}>
          Aprovar
        </button>
        <button className="admin-button admin-button--reject" onClick={() => admin.reject(user.id)}>
          Rejeitar
        </button>
      </div>
    </div>
  )
}

export function UserCard({ user, admin }: { user: Profile; admin: AdminUsers }) {
  const suspended = user.status === 'suspenso'
  return (
    <div className={`admin-user-card${suspended ? ' admin-user-card--suspended' : ''}`}>
      <Avatar name={user.name} />
      <div className="admin-user-info">
        <div className="admin-user-name-row">
          <span className="admin-user-name">{user.name || '—'}</span>
          <RoleBadge role={user.role} />
          {user.is_admin && <span className="pill pill--info">Admin</span>}
          <StatusBadge suspended={suspended} />
        </div>
        <p className="admin-user-email">{user.email}</p>
      </div>
      {user.id === admin.currentUserId ? (
        <span className="admin-self">Você</span>
      ) : (
        <div className="admin-actions admin-actions--compact">
          <button className="admin-small-button" onClick={() => admin.toggleAdmin(user)}>
            {user.is_admin ? 'Remover admin' : 'Tornar admin'}
          </button>
          <button
            className={`admin-small-button ${suspended ? 'admin-small-button--reactivate' : 'admin-small-button--suspend'}`}
            onClick={() => admin.toggleSuspend(user)}
          >
            {suspended ? 'Reativar' : 'Suspender'}
          </button>
          <button className="admin-small-button admin-small-button--remove" onClick={() => admin.remove(user.id)}>
            Remover
          </button>
        </div>
      )}
    </div>
  )
}
