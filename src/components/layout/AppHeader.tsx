import { BrandMark } from '../common/BrandMark'

type AppHeaderProps = {
  isAdmin?: boolean
  onAdminClick?: () => void
}

export function AppHeader({ isAdmin, onAdminClick }: AppHeaderProps) {
  return (
    <header className="topbar" style={{ position: 'relative' }}>
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', padding: '0 1.25rem', boxSizing: 'border-box' }}>
        <div className="header-brand" style={{ flex: 1, marginInline: 0 }}>
          <BrandMark />
          <div>
            <strong>DiagnoVetis</strong>
            <span>IFES Santa Teresa</span>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={onAdminClick}
            title="Painel Admin"
            aria-label="Painel Admin"
            style={{
              background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.4)',
              borderRadius: '8px', cursor: 'pointer', padding: '0.35rem 0.6rem',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
              color: '#fff', transition: 'background 0.15s', lineHeight: 1,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.28)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="3.25" />
              <path d="M5.5 20v-1.5a6.5 6.5 0 0 1 13 0V20" />
              <path d="M17 3.5l1.5 1.5-1.5 1.5" />
              <path d="M19 5h-2.5" />
            </svg>
            <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.05em' }}>ADM</span>
          </button>
        )}
      </div>
    </header>
  )
}
