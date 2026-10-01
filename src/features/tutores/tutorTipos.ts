import type { TipoResponsavel } from '../../models/Tutor'

export type TipoCadastroCompleto = Extract<TipoResponsavel, 'pessoa' | 'instituicao'>

export const ROTULOS_TIPO_RESPONSAVEL: Record<TipoResponsavel, string> = {
  pessoa: 'Pessoa física',
  instituicao: 'Instituição',
  ifes: 'Animal institucional (IFES - Campus Santa Teresa)',
  sem_responsavel: 'Resgatado / sem responsável identificado',
}

export type DadosFormularioTutor = {
  tipo: TipoCadastroCompleto
  nome: string
  cpf: string
  cnpj: string
  contato: string
  telefone: string
  email: string
  dataCadastro: string
  rua: string
  numero: string
  bairro: string
  cidade: string
  estado: string
  cep: string
}
