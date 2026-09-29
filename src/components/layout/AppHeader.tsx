import type { ReactNode } from 'react'
import { BrandMark } from '../common/BrandMark'

type AppHeaderProps = {
  isAdmin?: boolean
  onAdminClick?: () => void
  actions?: ReactNode
}

export function AppHeader({ isAdmin, onAdminClick, actions }: AppHeaderProps) {
  return (
    <header className="topbar topbar--app">
      <div className="topbar-inner">
        <div className="header-brand">
          <BrandMark />
          <div>
            <strong>DiagnoVetis</strong>
            <span>IFES Santa Teresa</span>
          </div>
        </div>
        <div className="topbar-actions">
          {actions}
          {isAdmin && (
            <button className="header-action" onClick={onAdminClick} title="Painel Admin" aria-label="Painel Admin">
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
                <circle cx="12" cy="8" r="3.25" />
                <path d="M5.5 20v-1.5a6.5 6.5 0 0 1 13 0V20" />
                <path d="M17 3.5l1.5 1.5-1.5 1.5" />
                <path d="M19 5h-2.5" />
              </svg>
              <span className="header-action-label">ADM</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
