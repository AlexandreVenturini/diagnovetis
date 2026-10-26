import { useState } from 'react'
import { Abas } from '../../components/common/Abas'
import { CabecalhoTela } from '../../components/common/CabecalhoTela'
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
      <CabecalhoTela
        voltar={{ rotulo: 'Voltar ao painel', aoClicar: aoFechar }}
        titulo="Painel Administrativo"
        descricao="Área restrita: aprove os cadastros e gerencie os usuários do sistema."
      />
      <Abas
        rotulo="Usuários"
        abas={[
          { id: 'pendentes', rotulo: 'Pendentes', contador: pendentes.length },
          { id: 'usuarios', rotulo: 'Usuários' },
        ]}
        ativa={aba}
        aoSelecionar={setAba}
      />

      {admin.mensagem && (
        <p className="page-error" role="alert">
          {admin.mensagem}
        </p>
      )}

      {renderizarConteudo()}
    </div>
  )
}
