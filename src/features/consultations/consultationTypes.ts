export type ConsultationStep = 1 | 2 | 3 | 4

export type ConsultationData = {
  weight?: string
  patientId?: string
  dogName: string
  age: string
  breed: string
  tutorName: string
  veterinarian: string
  mainComplaint: string
  history: string
  mucosa: string
  capillaryRefill: string
  heartRate: string
  respiratoryRate: string
  temperature: string
  hydration: string
  consciousness: string
  zoonosisSearch: string
  conduct: string
}

export const EMPTY_CONSULTATION: ConsultationData = {
  dogName: '', age: '', breed: '', tutorName: '', veterinarian: '',
  mainComplaint: '', history: '', mucosa: '', capillaryRefill: '',
  heartRate: '', respiratoryRate: '', temperature: '', hydration: 'Normal',
  consciousness: 'Alerta', zoonosisSearch: '', conduct: '',
}
