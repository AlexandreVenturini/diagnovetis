import type { Exame } from '../../models/Exame'
import type { RegistroObito } from './obito/obitoTipos'

export type RegistroPeso = { data: string; peso: number }

export type RegistroExameFisico = {
  temperatura?: number
  frequenciaCardiaca?: number
  frequenciaRespiratoria?: number
  tpc?: string
  mucosas?: string
  hidratacao?: string
  nivelConsciencia?: string
  pelePelagem?: string
  olhos?: string
  ouvidos?: string
  bocaDentes?: string
  sistemaRespiratorio?: string
  sistemaCardiovascular?: string
  sistemaGastrointestinal?: string
  sistemaUrinario?: string
  sistemaReprodutivo?: string
  sistemaNeurologico?: string
  dor?: string
}

export type RegistroAlta = {
  dados?: string
  condicao?: string
  orientacoes?: string
  prognostico?: string
}

export type RegistroClinico = {
  examesComplementares?: Exame[]
  id: number
  data: string
  veterinario: string
  crmv: string
  estudantes: string[]
  descricao: string
  diagnostico: string
  conduta: string
  validadoPor: string
  exameFisico?: RegistroExameFisico
  alta?: RegistroAlta
  versao?: number
  retificadoEm?: Date | null
  retificadoPorNome?: string
}

export type Prontuario = {
  id: number
  obito?: RegistroObito | null
  nomePet: string
  nomeTutor: string
  cpfTutor: string
  telefoneTutor: string
  emailTutor: string
  enderecoTutor: string
  cidadeTutor: string
  raca: string
  idade: string
  sexo: string
  alergias: string[]
  doencasAnteriores: string[]
  vacinas: string[]
  pesos: RegistroPeso[]
  atendimentos: RegistroClinico[]
}
