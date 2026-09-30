import { useEffect, useState } from 'react'
import { supabase } from '../../services/storage/supabaseClient'
import type { Profile } from '../auth/profile'

type ProfileChanges = Partial<Pick<Profile, 'status' | 'is_admin'>>
type AdminData = { currentUserId: string | null; profiles: Profile[]; error: string }

async function fetchAdminData(): Promise<AdminData> {
  const [{ data: auth }, { data, error }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).returns<Profile[]>(),
  ])
  return { currentUserId: auth.user?.id ?? null, profiles: data ?? [], error: error?.message ?? '' }
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
    const { error } = await supabase.from('profiles').update(changes).eq('id', userId)
    if (error) {
      setMessage(errorLabel + ': ' + error.message)
      return
    }
    await load()
  }

  async function remove(userId: string, errorLabel: string) {
    const { error } = await supabase.rpc('admin_remover_usuario', { p_user_id: userId })
    if (error) {
      setMessage(errorLabel + ': ' + error.message)
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
