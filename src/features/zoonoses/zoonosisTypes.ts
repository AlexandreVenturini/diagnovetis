export type RiskLevel = 'Alto' | 'Médio' | 'Baixo'
export type PrevalenceLevel = 'Alta' | 'Média' | 'Baixa'

export type ClinicalMetadata = {
  category: string
  conditionType: string
  systems: string[]
  etiology: string
  ageGroups: string[]
  isZoonosis: boolean
  transmission: string
  diagnostics: string[]
  differentials: string[]
  protocols: string[]
  alert: string
  hosts: string[]
  prevalence: PrevalenceLevel
}

export const EMPTY_CLINICAL: ClinicalMetadata = {
  category: '', conditionType: 'Doença', systems: [], etiology: '', ageGroups: [],
  isZoonosis: true, transmission: '', diagnostics: [], differentials: [], protocols: [],
  alert: '', hosts: ['Cães'], prevalence: 'Média',
}

export type Zoonosis = {
  clinical: ClinicalMetadata
  id: number
  name: string
  agent: string
  risk: RiskLevel
  prevalence: PrevalenceLevel
  hosts: string[]
  transmission: string
  symptoms: string[]
  diagnostics: string[]
  prevention: string[]
}

export type ZoonosisFormData = Omit<Zoonosis, 'id'>
export type ZoonosisScreen = 'browse' | 'create'
