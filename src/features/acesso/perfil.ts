import { PerfilService } from '../../services/PerfilService'

const perfilService = new PerfilService()

export type Papel = 'veterinarian' | 'attendant'
export type SituacaoPerfil = 'pendente' | 'aprovado' | 'suspenso'

export type Perfil = {
  id: string
  nome: string
  email: string
  papel: Papel | null
  crmv: string | null
  matricula: string | null
  ehAdmin: boolean
  situacao: SituacaoPerfil
  emailConfirmado: boolean
  criadoEm: string
}

export type ResultadoAcesso = { ok: true; papel: Papel; perfil: Perfil } | { ok: false; mensagem: string }

export async function verificarAcesso(idUsuario: string): Promise<ResultadoAcesso> {
  let dados: Perfil | null
  try {
    dados = await perfilService.buscar(idUsuario)
  } catch {
    return { ok: false, mensagem: 'Não foi possível verificar seu cadastro. Tente novamente.' }
  }
  if (!dados) return { ok: false, mensagem: 'Perfil de acesso não encontrado. Procure um administrador.' }
  if (dados.situacao === 'pendente') {
    return { ok: false, mensagem: 'Seu cadastro ainda não foi aprovado. Aguarde a liberação de um administrador.' }
  }
  if (dados.situacao === 'suspenso') {
    return { ok: false, mensagem: 'Seu acesso está suspenso. Procure um administrador.' }
  }
  if (dados.papel !== 'veterinarian' && dados.papel !== 'attendant') {
    return { ok: false, mensagem: 'O usuário não possui um perfil de acesso válido.' }
  }
  return { ok: true, papel: dados.papel, perfil: dados }
}
