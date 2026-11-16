import { useState } from 'react'
import type { ReactNode } from 'react'
import { Cabecalho } from '../../components/layout/Cabecalho'
import { PainelAdmin } from '../admin/PainelAdmin'
import { PaginaGuia } from '../guia/PaginaGuia'

export type UsuarioPainel = { email: string; nome: string; ehAdmin: boolean } | null

type EstruturaPainelProps = {
  usuario: UsuarioPainel
  rotuloPerfil: string
  aoSair: () => void
  aoVoltarInicio: () => void
  acoesCabecalho?: ReactNode
  children: ReactNode
}

export function EstruturaPainel({
  usuario,
  rotuloPerfil,
  aoSair,
  aoVoltarInicio,
  acoesCabecalho,
  children,
}: EstruturaPainelProps) {
  const [telaExtra, setTelaExtra] = useState<'admin' | 'guia' | null>(null)
  const voltarAoInicio = () => {
    setTelaExtra(null)
    aoVoltarInicio()
  }

  return (
    <div className="app-shell">
      <Cabecalho
        ehAdmin={usuario?.ehAdmin}
        aoClicarAdmin={() => setTelaExtra('admin')}
        aoClicarGuia={() => setTelaExtra('guia')}
        acoes={acoesCabecalho}
      />
      <main className="shell-width dashboard-content">
        {telaExtra === 'admin' ? (
          <PainelAdmin aoFechar={voltarAoInicio} />
        ) : telaExtra === 'guia' ? (
          <PaginaGuia aoFechar={voltarAoInicio} />
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
