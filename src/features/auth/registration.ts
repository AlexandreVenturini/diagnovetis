import { supabase } from '../../services/storage/supabaseClient'
import type { UserRole } from './profile'

export const UFS = 'AC AL AM AP BA CE DF ES GO MA MG MS MT PA PB PE PI PR RJ RN RO RR RS SC SE SP TO'.split(' ')

export type RegistrationData = {
  name: string
  email: string
  password: string
  confirm: string
  role: UserRole
  crmvUf: string
  crmvNumero: string
  matricula: string
}

export function formatMatricula(value: string) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 20)
}

export function validateRegistration(data: RegistrationData): string {
  if (data.password !== data.confirm) return 'As senhas não coincidem.'
  if (data.password.length < 6) return 'A senha deve ter pelo menos 6 caracteres.'
  if (data.role === 'veterinarian' && !/^\d{1,10}$/.test(data.crmvNumero))
    return 'Informe o número do CRMV (somente números).'
  if (data.role === 'attendant' && data.matricula.length < 4) return 'Informe sua matrícula do IFES.'
  return ''
}

export async function registerUser(data: RegistrationData): Promise<string> {
  const crmv = data.role === 'veterinarian' ? `${data.crmvUf}-${Number(data.crmvNumero)}` : undefined
  const matricula = data.role === 'attendant' ? data.matricula : undefined

  const { data: emUso, error: checkError } = await supabase.rpc('cadastro_disponivel', {
    p_crmv: crmv ?? null,
    p_matricula: matricula ?? null,
  })
  if (checkError) return 'Não foi possível verificar os dados do cadastro. Tente novamente.'
  if (emUso === 'crmv') return 'Este CRMV já está cadastrado. Se ele é seu, procure um administrador.'
  if (emUso === 'matricula') return 'Esta matrícula já está cadastrada. Se ela é sua, procure um administrador.'

  const { data: signUp, error } = await supabase.auth.signUp({
    email: data.email.trim(),
    password: data.password,
    options: {
      emailRedirectTo: window.location.origin,
      data: { role: data.role, name: data.name.trim(), crmv, matricula },
    },
  })
  if (error)
    return error.message.includes('Database error')
      ? 'Não foi possível criar a conta. Verifique se o CRMV ou a matrícula já estão em uso.'
      : error.message
  if (signUp.session) await supabase.auth.signOut()
  return ''
}
