export type RecordKind = 'Consulta' | 'Vacina' | 'Exame' | 'Tratamento' | 'Retorno'
export type RecordValidation = 'draft' | 'pending' | 'validated'

export type WeightEntry = { date: string; weight: number }

export type ExameFisicoRecord = {
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

export type AltaRecord = {
  data?: string
  condicao?: string
  orientacoes?: string
  prognostico?: string
}

export type ClinicalRecord = {
  id: number
  kind: RecordKind
  date: string
  veterinarian: string
  crmv: string
  students: string[]
  description: string
  diagnosis: string
  conduct: string
  exams: string[]
  attachments: string[]
  prescriptions: string[]
  validation: RecordValidation
  validatedBy: string
  exameFisico?: ExameFisicoRecord
  alta?: AltaRecord
}

export type PatientRecord = {
  id: number
  dogName: string
  tutorName: string
  tutorCpf: string
  tutorPhone: string
  tutorEmail: string
  tutorAddress: string
  tutorCity: string
  breed: string
  age: string
  sex: string
  allergies: string[]
  previousDiseases: string[]
  vaccines: string[]
  weights: WeightEntry[]
  records: ClinicalRecord[]
}

export type ClinicalRecordForm = Omit<ClinicalRecord, 'id' | 'attachments' | 'validation' | 'validatedBy'> & { attachments: string[] }
export type RecordScreen = 'list' | 'details' | 'create'
