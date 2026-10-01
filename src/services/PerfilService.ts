import type { Papel, Perfil, SituacaoPerfil } from '../features/acesso/perfil'
import { supabase } from './storage/supabaseClient'

export type AlteracoesPerfil = Partial<Pick<Perfil, 'situacao' | 'ehAdmin'>>

type PerfilRow = {
  id: string
  name: string
  email: string
  role: Papel | null
  crmv: string | null
  matricula: string | null
  is_admin: boolean
  status: SituacaoPerfil
  email_confirmado: boolean
  created_at: string
}

function linhaParaPerfil(linha: PerfilRow): Perfil {
  return {
    id: linha.id,
    nome: linha.name,
    email: linha.email,
    papel: linha.role,
    crmv: linha.crmv,
    matricula: linha.matricula,
    ehAdmin: linha.is_admin,
    situacao: linha.status,
    emailConfirmado: linha.email_confirmado,
    criadoEm: linha.created_at,
  }
}

function alteracoesParaRow(alteracoes: AlteracoesPerfil): Partial<PerfilRow> {
  const linha: Partial<PerfilRow> = {}
  if (alteracoes.situacao !== undefined) linha.status = alteracoes.situacao
  if (alteracoes.ehAdmin !== undefined) linha.is_admin = alteracoes.ehAdmin
  return linha
}

export class PerfilService {
  async buscar(idUsuario: string): Promise<Perfil | null> {
    const { data: dados, error: erro } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', idUsuario)
      .maybeSingle<PerfilRow>()
    if (erro) throw new Error(erro.message)
    return dados ? linhaParaPerfil(dados) : null
  }

  async listar(): Promise<Perfil[]> {
    const { data: dados, error: erro } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .returns<PerfilRow[]>()
    if (erro) throw new Error(erro.message)
    return (dados ?? []).map(linhaParaPerfil)
  }

  async atualizar(idUsuario: string, alteracoes: AlteracoesPerfil): Promise<void> {
    const { error: erro } = await supabase.from('profiles').update(alteracoesParaRow(alteracoes)).eq('id', idUsuario)
    if (erro) throw new Error(erro.message)
  }

  async remover(idUsuario: string): Promise<void> {
    const { error: erro } = await supabase.rpc('admin_remover_usuario', { p_user_id: idUsuario })
    if (erro) throw new Error(erro.message)
  }

  async cadastroEmUso(crmv: string | null, matricula: string | null): Promise<'crmv' | 'matricula' | null> {
    const { data: dados, error: erro } = await supabase.rpc('cadastro_disponivel', {
      p_crmv: crmv,
      p_matricula: matricula,
    })
    if (erro) throw new Error(erro.message)
    return dados === 'crmv' || dados === 'matricula' ? dados : null
  }
}
