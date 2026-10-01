import { useState } from 'react'
import type { ReactNode } from 'react'
import { Cabecalho } from '../../components/layout/Cabecalho'
import { PainelAdmin } from '../admin/PainelAdmin'

export type UsuarioPainel = { email: string; nome: string; ehAdmin: boolean } | null

type EstruturaPainelProps = {
  usuario: UsuarioPainel
  rotuloPerfil: string
  aoSair: () => void
  acoesCabecalho?: ReactNode
  children: ReactNode
}

export function EstruturaPainel({ usuario, rotuloPerfil, aoSair, acoesCabecalho, children }: EstruturaPainelProps) {
  const [mostrarAdmin, setMostrarAdmin] = useState(false)

  return (
    <div className="app-shell">
      <Cabecalho ehAdmin={usuario?.ehAdmin} aoClicarAdmin={() => setMostrarAdmin(true)} acoes={acoesCabecalho} />
      <main className="shell-width dashboard-content">
        {mostrarAdmin ? (
          <PainelAdmin aoFechar={() => setMostrarAdmin(false)} />
        ) : (
          <>
            <section className="user-row">
              <div className="profile-badge">
                <span>Perfil:</span>
                {rotuloPerfil}
              </div>
              <button className="logout-button" onClick={aoSair}>
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
