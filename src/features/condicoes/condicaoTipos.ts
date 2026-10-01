export type NivelRisco = 'Alto' | 'Médio' | 'Baixo'
export type NivelPrevalencia = 'Alta' | 'Média' | 'Baixa'

export type DadosClinicos = {
  categoria: string
  tipoCondicao: string
  sistemas: string[]
  etiologia: string
  faixasEtarias: string[]
  ehZoonose: boolean
  transmissao: string
  examesSugeridos: string[]
  diferenciais: string[]
  protocolos: string[]
  alerta: string
  hospedeiros: string[]
  prevalencia: NivelPrevalencia
}

export const DADOS_CLINICOS_VAZIOS: DadosClinicos = {
  categoria: '',
  tipoCondicao: 'Doença',
  sistemas: [],
  etiologia: '',
  faixasEtarias: [],
  ehZoonose: true,
  transmissao: '',
  examesSugeridos: [],
  diferenciais: [],
  protocolos: [],
  alerta: '',
  hospedeiros: ['Cães'],
  prevalencia: 'Média',
}

export type Condicao = {
  dadosClinicos: DadosClinicos
  id: number
  nome: string
  agente: string
  risco: NivelRisco
  prevalencia: NivelPrevalencia
  hospedeiros: string[]
  transmissao: string
  sintomas: string[]
  examesSugeridos: string[]
  prevencao: string[]
}

export type DadosFormularioCondicao = Omit<Condicao, 'id'>
export type TelaCondicoes = 'consulta' | 'cadastro'
