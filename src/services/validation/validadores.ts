import { ValidacaoError } from './ValidacaoError'

export function validarObrigatorio(valor: string, campo: string): void {
  if (!valor || valor.trim().length === 0) {
    throw new ValidacaoError(campo, `O campo "${campo}" é obrigatório.`)
  }
}

export function validarEmail(email: string, campo = 'email'): void {
  validarObrigatorio(email, campo)
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!regex.test(email.trim())) {
    throw new ValidacaoError(campo, `O campo "${campo}" deve conter um e-mail válido.`)
  }
}

export function validarTelefone(telefone: string, campo = 'telefone'): void {
  validarObrigatorio(telefone, campo)
  const apenasDigitos = telefone.replace(/\D/g, '')
  if (apenasDigitos.length < 10 || apenasDigitos.length > 11) {
    throw new ValidacaoError(campo, `O campo "${campo}" deve conter um telefone válido (10 ou 11 dígitos).`)
  }
}

export function validarCep(cep: string, campo = 'cep'): void {
  validarObrigatorio(cep, campo)
  const apenasDigitos = cep.replace(/\D/g, '')
  if (apenasDigitos.length !== 8) {
    throw new ValidacaoError(campo, `O campo "${campo}" deve conter 8 dígitos.`)
  }
}

export function validarData(dados: Date, campo = 'data'): void {
  if (!(dados instanceof Date) || isNaN(dados.getTime())) {
    throw new ValidacaoError(campo, `O campo "${campo}" deve conter uma data válida.`)
  }
}

export function validarDataFutura(dados: Date, campo = 'data'): void {
  validarData(dados, campo)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  if (dados < hoje) {
    throw new ValidacaoError(campo, `O campo "${campo}" não pode ser uma data no passado.`)
  }
}

export function validarPositivo(valor: number, campo: string): void {
  if (valor <= 0) {
    throw new ValidacaoError(campo, `O campo "${campo}" deve ser maior que zero.`)
  }
}

const GRAUS_RISCO_VALIDOS = ['baixo', 'medio', 'alto'] as const
type GrauRisco = (typeof GRAUS_RISCO_VALIDOS)[number]

export function validarGrauRisco(grau: string, campo = 'grauRisco'): void {
  validarObrigatorio(grau, campo)
  if (!GRAUS_RISCO_VALIDOS.includes(grau.toLowerCase() as GrauRisco)) {
    throw new ValidacaoError(campo, `O campo "${campo}" deve ser "baixo", "medio" ou "alto".`)
  }
}

export function validarIdUnico<T extends { id: number }>(id: number, existentes: T[], entidade: string): void {
  if (existentes.some((item) => item.id === id)) {
    throw new ValidacaoError('id', `Já existe um(a) ${entidade} com o ID ${id}.`)
  }
}
