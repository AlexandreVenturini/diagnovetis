export type ConsultationStep = 1 | 2 | 3 | 4 | 5

export type ConsultationData = {
  dogName: string
  age: string
  breed: string
  tutorName: string
  veterinarian: string
  patientId?: string
  weight?: string
  mainComplaint: string
  history: string
  mucosa: string
  capillaryRefill: string
  heartRate: string
  respiratoryRate: string
  temperature: string
  hydration: string
  consciousness: string
  skinAndCoat: string
  eyes: string
  ears: string
  mouthAndTeeth: string
  respiratorySystem: string
  cardiovascularSystem: string
  gastrointestinalSystem: string
  urinarySystem: string
  reproductiveSystem: string
  neurologicalSystem: string
  pain: string
  diagnosis: string
  zoonosisSearch: string
  conduct: string
  dischargeDate: string
  dischargeCondition: string
  dischargeInstructions: string
  dischargePrognosis: string
}

export const EMPTY_CONSULTATION: ConsultationData = {
  dogName: '', age: '', breed: '', tutorName: '', veterinarian: '',
  mainComplaint: '', history: '',
  mucosa: '', capillaryRefill: '', heartRate: '', respiratoryRate: '',
  temperature: '', hydration: 'Normal', consciousness: 'Alerta',
  skinAndCoat: '', eyes: '', ears: '', mouthAndTeeth: '',
  respiratorySystem: '', cardiovascularSystem: '', gastrointestinalSystem: '',
  urinarySystem: '', reproductiveSystem: '', neurologicalSystem: '', pain: '',
  diagnosis: '', zoonosisSearch: '', conduct: '',
  dischargeDate: '', dischargeCondition: '', dischargeInstructions: '', dischargePrognosis: '',
}
