import { useState } from 'react'
import type { ReactNode } from 'react'
import { AppHeader } from '../../components/layout/AppHeader'
import { AdminPanel } from '../admin/AdminPanel'

export type DashboardUser = { email: string; name: string; isAdmin: boolean } | null

type DashboardShellProps = {
  user: DashboardUser
  profileLabel: string
  onLogout: () => void
  headerActions?: ReactNode
  children: ReactNode
}

export function DashboardShell({ user, profileLabel, onLogout, headerActions, children }: DashboardShellProps) {
  const [showAdmin, setShowAdmin] = useState(false)

  return (
    <div className="app-shell">
      <AppHeader isAdmin={user?.isAdmin} onAdminClick={() => setShowAdmin(true)} actions={headerActions} />
      <main className="shell-width dashboard-content">
        {showAdmin ? (
          <AdminPanel onClose={() => setShowAdmin(false)} />
        ) : (
          <>
            <section className="user-row">
              <div className="profile-badge">
                <span>Perfil:</span>
                {profileLabel}
              </div>
              <button className="logout-button" onClick={onLogout}>
                <span>↪</span> Sair
              </button>
            </section>
            {children}
          </>
        )}
      </main>
    </div>
  )
}
