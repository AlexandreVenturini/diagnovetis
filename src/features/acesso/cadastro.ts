import { AutenticacaoService } from '../../services/AutenticacaoService'
import { PerfilService } from '../../services/PerfilService'
import type { Papel } from './perfil'

const autenticacaoService = new AutenticacaoService()
const perfilService = new PerfilService()

export const UFS = 'AC AL AM AP BA CE DF ES GO MA MG MS MT PA PB PE PI PR RJ RN RO RR RS SC SE SP TO'.split(' ')

export type DadosCadastro = {
  nome: string
  email: string
  senha: string
  confirmacao: string
  papel: Papel
  crmvUf: string
  crmvNumero: string
  matricula: string
}

export function formatarMatricula(valor: string) {
  return valor
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 20)
}

export function validarCadastro(dados: DadosCadastro): string {
  if (dados.senha !== dados.confirmacao) return 'As senhas não coincidem.'
  if (dados.senha.length < 6) return 'A senha deve ter pelo menos 6 caracteres.'
  if (dados.papel === 'veterinarian' && !/^\d{1,10}$/.test(dados.crmvNumero))
    return 'Informe o número do CRMV (somente números).'
  if (dados.papel === 'attendant' && dados.matricula.length < 4) return 'Informe sua matrícula do IFES.'
  return ''
}

async function dadoEmUso(crmv: string | undefined, matricula: string | undefined) {
  try {
    const emUso = await perfilService.cadastroEmUso(crmv ?? null, matricula ?? null)
    if (emUso === 'crmv') return 'Este CRMV já está cadastrado. Se ele é seu, procure um administrador.'
    if (emUso === 'matricula') return 'Esta matrícula já está cadastrada. Se ela é sua, procure um administrador.'
    return ''
  } catch {
    return 'Não foi possível verificar os dados do cadastro. Tente novamente.'
  }
}

export async function cadastrarUsuario(dados: DadosCadastro): Promise<string> {
  const crmv = dados.papel === 'veterinarian' ? `${dados.crmvUf}-${Number(dados.crmvNumero)}` : undefined
  const matricula = dados.papel === 'attendant' ? dados.matricula : undefined

  const emUso = await dadoEmUso(crmv, matricula)
  if (emUso) return emUso

  const { erro, comSessao } = await autenticacaoService.cadastrar({
    email: dados.email.trim(),
    senha: dados.senha,
    metadados: { role: dados.papel, name: dados.nome.trim(), crmv, matricula },
  })
  if (erro)
    return erro.includes('Database error')
      ? 'Não foi possível criar a conta. Verifique se o CRMV ou a matrícula já estão em uso.'
      : erro
  if (comSessao) await autenticacaoService.sair()
  return ''
}
