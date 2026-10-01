import type { TipoResponsavel } from '../../models/Tutor'

export type PetResumo = {
  id: number
  nome: string
  raca: string
  idade: string
  peso: string
  sexo: string
  tutor: string
  contato: string
  historico: string
  tipoResponsavel?: TipoResponsavel
  setor?: string
  observacoesResponsavel?: string
  cadastradoEm?: string
  obitoEm?: string
}

export type DadosFormularioPet = Omit<PetResumo, 'id'>
export type TelaPets = 'lista' | 'cadastro' | 'edicao' | 'detalhes'
