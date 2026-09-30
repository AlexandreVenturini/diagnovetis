import { useEffect, useState } from 'react'
import { AuthService } from '../../services/AuthService'
import { ProfileService, type ProfileChanges } from '../../services/ProfileService'
import type { Profile } from '../auth/profile'

type AdminData = { currentUserId: string | null; profiles: Profile[]; error: string }

const authService = new AuthService()
const profileService = new ProfileService()

async function fetchAdminData(): Promise<AdminData> {
  const [user, profiles] = await Promise.all([
    authService.usuarioAtual(),
    profileService.listar().then(
      (list) => ({ list, error: '' }),
      (error: Error) => ({ list: [] as Profile[], error: error.message }),
    ),
  ])
  return { currentUserId: user?.id ?? null, profiles: profiles.list, error: profiles.error }
}

async function attempt(action: () => Promise<void>): Promise<string> {
  try {
    await action()
    return ''
  } catch (error) {
    return (error as Error).message
  }
}

export function useAdminUsers() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  function apply(result: AdminData) {
    setCurrentUserId(result.currentUserId)
    if (result.error) setMessage('Erro ao carregar usuários: ' + result.error)
    setProfiles(result.profiles)
    setLoading(false)
  }

  async function load() {
    setLoading(true)
    setMessage('')
    apply(await fetchAdminData())
  }

  useEffect(() => {
    let active = true
    void fetchAdminData().then((result) => {
      if (active) apply(result)
    })
    return () => {
      active = false
    }
  }, [])

  async function update(userId: string, changes: ProfileChanges, errorLabel: string) {
    const error = await attempt(() => profileService.atualizar(userId, changes))
    if (error) {
      setMessage(errorLabel + ': ' + error)
      return
    }
    await load()
  }

  async function remove(userId: string, errorLabel: string) {
    const error = await attempt(() => profileService.remover(userId))
    if (error) {
      setMessage(errorLabel + ': ' + error)
      return
    }
    await load()
  }

  return {
    pending: profiles.filter((profile) => profile.status === 'pendente'),
    users: profiles.filter((profile) => profile.status !== 'pendente'),
    currentUserId,
    loading,
    message,
    approve: (userId: string) => update(userId, { status: 'aprovado' }, 'Erro ao aprovar'),
    reject: (userId: string) => {
      if (!window.confirm('Rejeitar este cadastro? A conta será excluída.')) return
      return remove(userId, 'Erro ao rejeitar')
    },
    toggleAdmin: (user: Profile) => update(user.id, { is_admin: !user.is_admin }, 'Erro ao atualizar admin'),
    toggleSuspend: (user: Profile) =>
      update(user.id, { status: user.status === 'suspenso' ? 'aprovado' : 'suspenso' }, 'Erro ao suspender'),
    remove: (userId: string) => {
      if (!window.confirm('Tem certeza que deseja remover este usuário permanentemente?')) return
      return remove(userId, 'Erro ao remover')
    },
  }
}

export type AdminUsers = ReturnType<typeof useAdminUsers>
