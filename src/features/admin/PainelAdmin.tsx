import { useState } from 'react'
import { CartaoUsuarioPendente, CartaoUsuario } from './CartoesUsuario'
import { useUsuariosAdmin } from './useUsuariosAdmin'

type PainelAdminProps = {
  aoFechar: () => void
}

type Aba = 'pendentes' | 'usuarios'

export function PainelAdmin({ aoFechar }: PainelAdminProps) {
  const [aba, setAba] = useState<Aba>('pendentes')
  const admin = useUsuariosAdmin()
  const { pendentes, usuarios } = admin

  function renderizarConteudo() {
    if (admin.carregando)
      return (
        <div className="admin-empty">
          <div className="admin-empty-icon">⏳</div>
          <p>Carregando usuários...</p>
        </div>
      )
    if (aba === 'pendentes')
      return pendentes.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty-icon admin-empty-icon--large">✅</div>
          <p className="admin-empty-title">Nenhum cadastro pendente</p>
          <p className="admin-empty-text">Todos os usuários foram revisados.</p>
        </div>
      ) : (
        <div className="admin-list">
          {pendentes.map((usuario) => (
            <CartaoUsuarioPendente key={usuario.id} usuario={usuario} admin={admin} />
          ))}
        </div>
      )
    return usuarios.length === 0 ? (
      <div className="admin-empty">
        <p>Nenhum usuário cadastrado.</p>
      </div>
    ) : (
      <div className="admin-list">
        {usuarios.map((usuario) => (
          <CartaoUsuario key={usuario.id} usuario={usuario} admin={admin} />
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
        <button className="admin-back-button" onClick={aoFechar}>
          ← Voltar
        </button>
      </div>

      <div className="admin-tabs">
        {(['pendentes', 'usuarios'] as const).map((item) => (
          <button key={item} className={`admin-tab${aba === item ? ' active' : ''}`} onClick={() => setAba(item)}>
            {item === 'pendentes' && pendentes.length > 0 && (
              <span className="admin-tab-count">{pendentes.length}</span>
            )}
            {item === 'pendentes' ? 'Pendentes' : 'Usuários'}
          </button>
        ))}
      </div>

      {admin.mensagem && <div className="admin-error">{admin.mensagem}</div>}

      {renderizarConteudo()}
    </div>
  )
}
