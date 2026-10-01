import { useState } from 'react'

const CFMV_BUSCA_URL = 'https://siscad.cfmv.gov.br/paginas/busca'

export function InfoCrmv({ crmv }: { crmv: string }) {
  const [copiado, setCopiado] = useState(false)
  const numero = crmv.split('-').pop() ?? crmv

  async function copiar() {
    try {
      await navigator.clipboard.writeText(numero)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1500)
    } catch {
      setCopiado(false)
    }
  }

  return (
    <div className="admin-crmv">
      <span>CRMV: {crmv}</span>
      <button type="button" className="admin-chip-button" onClick={copiar}>
        {copiado ? 'Copiado!' : 'Copiar número'}
      </button>
      <a className="admin-chip-button" href={CFMV_BUSCA_URL} target="_blank" rel="noopener noreferrer">
        Consultar no CFMV ↗
      </a>
    </div>
  )
}

export function Avatar({ nome }: { nome: string }) {
  const iniciais =
    nome
      .trim()
      .split(' ')
      .map((palavra) => palavra[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'
  return <div className="admin-avatar">{iniciais}</div>
}

const ROTULOS_PAPEL: Record<string, string> = { veterinarian: 'Veterinário', attendant: 'Estudante' }

export function SeloPapel({ papel }: { papel: string | null }) {
  const rotulo = (papel && ROTULOS_PAPEL[papel]) || 'Sem perfil'
  return <span className={`pill ${papel === 'veterinarian' ? 'pill--success' : 'pill--warning'}`}>{rotulo}</span>
}

export function SeloSituacao({ suspenso }: { suspenso: boolean }) {
  return (
    <span className={`pill ${suspenso ? 'pill--danger' : 'pill--success'}`}>{suspenso ? 'Suspenso' : 'Ativo'}</span>
  )
}

export function SeloEmail({ confirmado }: { confirmado: boolean }) {
  return (
    <span className={`pill ${confirmado ? 'pill--success' : 'pill--neutral'}`}>
      {confirmado ? 'E-mail confirmado' : 'E-mail não confirmado'}
    </span>
  )
}
