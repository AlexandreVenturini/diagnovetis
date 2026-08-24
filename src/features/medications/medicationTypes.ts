export type Medication = {
  id: number
  commercialName: string
  activeIngredient: string
  indications: string[]
  dosage: string
  doseMgKg: number
  frequency: string
  route: string
  concentration: string
  concentrationMgMl: number | null
  contraindications: string[]
  notes: string
}

export type MedicationFormData = Omit<Medication, 'id' | 'indications' | 'contraindications'> & {
  indications: string
  contraindications: string
}
