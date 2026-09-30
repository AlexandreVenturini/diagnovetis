import { useState } from 'react'

const CFMV_BUSCA_URL = 'https://siscad.cfmv.gov.br/paginas/busca'

export function CrmvInfo({ crmv }: { crmv: string }) {
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

export function Avatar({ name }: { name: string }) {
  const initials =
    name
      .trim()
      .split(' ')
      .map((word) => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'
  return <div className="admin-avatar">{initials}</div>
}

const ROLE_LABELS: Record<string, string> = { veterinarian: 'Veterinário', attendant: 'Estudante' }

export function RoleBadge({ role }: { role: string | null }) {
  const label = (role && ROLE_LABELS[role]) || 'Sem perfil'
  return <span className={`pill ${role === 'veterinarian' ? 'pill--success' : 'pill--warning'}`}>{label}</span>
}

export function StatusBadge({ suspended }: { suspended: boolean }) {
  return (
    <span className={`pill ${suspended ? 'pill--danger' : 'pill--success'}`}>{suspended ? 'Suspenso' : 'Ativo'}</span>
  )
}

export function EmailBadge({ confirmed }: { confirmed: boolean }) {
  return (
    <span className={`pill ${confirmed ? 'pill--success' : 'pill--neutral'}`}>
      {confirmed ? 'E-mail confirmado' : 'E-mail não confirmado'}
    </span>
  )
}
