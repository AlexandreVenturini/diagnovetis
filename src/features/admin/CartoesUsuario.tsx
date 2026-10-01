import type { Perfil } from '../acesso/perfil'
import { Avatar, InfoCrmv, SeloEmail, SeloPapel, SeloSituacao } from './SelosUsuario'
import type { UsuariosAdmin } from './useUsuariosAdmin'

export function CartaoUsuarioPendente({ usuario, admin }: { usuario: Perfil; admin: UsuariosAdmin }) {
  return (
    <div className="admin-user-card">
      <Avatar nome={usuario.nome} />
      <div className="admin-user-info">
        <div className="admin-user-name-row">
          <span className="admin-user-name">{usuario.nome || '—'}</span>
          <SeloPapel papel={usuario.papel} />
          <SeloEmail confirmado={usuario.emailConfirmado} />
        </div>
        <p className="admin-user-email">{usuario.email}</p>
        {usuario.crmv && <InfoCrmv crmv={usuario.crmv} />}
        {usuario.matricula && <p className="admin-user-detail">Matrícula: {usuario.matricula}</p>}
      </div>
      <div className="admin-actions">
        <button className="admin-button admin-button--approve" onClick={() => admin.aprovar(usuario.id)}>
          Aprovar
        </button>
        <button className="admin-button admin-button--reject" onClick={() => admin.rejeitar(usuario.id)}>
          Rejeitar
        </button>
      </div>
    </div>
  )
}

export function CartaoUsuario({ usuario, admin }: { usuario: Perfil; admin: UsuariosAdmin }) {
  const suspenso = usuario.situacao === 'suspenso'
  return (
    <div className={`admin-user-card${suspenso ? ' admin-user-card--suspended' : ''}`}>
      <Avatar nome={usuario.nome} />
      <div className="admin-user-info">
        <div className="admin-user-name-row">
          <span className="admin-user-name">{usuario.nome || '—'}</span>
          <SeloPapel papel={usuario.papel} />
          {usuario.ehAdmin && <span className="pill pill--info">Admin</span>}
          <SeloSituacao suspenso={suspenso} />
        </div>
        <p className="admin-user-email">{usuario.email}</p>
      </div>
      {usuario.id === admin.idUsuarioAtual ? (
        <span className="admin-self">Você</span>
      ) : (
        <div className="admin-actions admin-actions--compact">
          <button className="admin-small-button" onClick={() => admin.alternarAdmin(usuario)}>
            {usuario.ehAdmin ? 'Remover admin' : 'Tornar admin'}
          </button>
          <button
            className={`admin-small-button ${suspenso ? 'admin-small-button--reactivate' : 'admin-small-button--suspend'}`}
            onClick={() => admin.alternarSuspensao(usuario)}
          >
            {suspenso ? 'Reativar' : 'Suspender'}
          </button>
          <button className="admin-small-button admin-small-button--remove" onClick={() => admin.remover(usuario.id)}>
            Remover
          </button>
        </div>
      )}
    </div>
  )
}
