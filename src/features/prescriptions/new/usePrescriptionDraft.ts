import { useState } from 'react'
import type { Medico } from '../../../models/Medico'
import type { Medicamento } from '../../../models/Medicamento'
import { EMPTY_CONSULTATION } from '../../consultations/consultationTypes'
import { emptyPrescription, emptyPrescriptionItem, type Prescription } from '../prescriptionReport'
import type { Dog } from '../../dogs/dogTypes'
import { applyDoseToPrescription, decimalValue } from './applyDose'
import { calculateDose } from './doseCalculation'

const STUDENT_VET = 'Veterinário que aprovar a receita'
const STUDENT_CRMV = 'Definido na aprovação'

export type DoseFeedback = { inputs: string; text: string; error: boolean }

const hasContent = (item: Prescription['items'][number]) => Object.values(item).some((value) => value.trim())

export function usePrescriptionDraft(dogs: Dog[], medicos: Medico[], isStudent: boolean) {
  const [petId, setPetId] = useState('')
  const [vetId, setVetId] = useState('')
  const [weight, setWeight] = useState('')
  const [prescription, setPrescription] = useState(emptyPrescription)
  const [medQuery, setMedQuery] = useState('')
  const [mgKg, setMgKg] = useState('')
  const [concentration, setConcentration] = useState('')
  const [doseFeedback, setDoseFeedback] = useState<DoseFeedback | null>(null)
  const [targetItem, setTargetItem] = useState(0)

  const dog = dogs.find((item) => item.id === Number(petId))
  const vet = medicos.find((item) => item.id === Number(vetId))
  const patient = {
    ...EMPTY_CONSULTATION,
    dogName: dog?.name ?? '',
    tutorName: dog?.tutor ?? '',
    breed: dog?.breed ?? '',
    age: dog?.age ?? '',
    veterinarian: isStudent ? STUDENT_VET : (vet?.nome ?? ''),
    weight,
    patientId: petId,
  }
  const previewPrescription = isStudent ? { ...prescription, crmv: STUDENT_CRMV } : prescription
  const doseInputs = JSON.stringify([
    petId,
    weight,
    mgKg,
    concentration,
    targetItem,
    prescription.items[targetItem]?.medication,
  ])

  function resetDose(nextConcentration = '') {
    setMgKg('')
    setConcentration(nextConcentration)
  }

  function reset() {
    setPetId('')
    setVetId('')
    setWeight('')
    setPrescription(emptyPrescription())
    resetDose()
    setTargetItem(0)
    setDoseFeedback(null)
    setMedQuery('')
  }

  function selectDog(next: Dog | null) {
    setPetId(next ? String(next.id) : '')
    setWeight(next?.weight.replace(/\s*kg\s*$/i, '').trim() ?? '')
    setPrescription((current) => ({ ...emptyPrescription(), crmv: current.crmv }))
    resetDose()
    setTargetItem(0)
    setDoseFeedback(null)
  }

  function changeWeight(value: string) {
    setWeight(value)
    setMgKg('')
  }

  function selectVet(id: string) {
    setVetId(id)
    setPrescription((current) => ({ ...current, crmv: medicos.find((item) => item.id === Number(id))?.crmv ?? '' }))
  }

  function addMedication(item: Medicamento) {
    const added = {
      ...emptyPrescriptionItem(),
      medication: `${item.nome} — ${item.concentracao} ${item.unidadeConcentracao} — ${item.formaFarmaceutica}`,
      route: item.viaAdministracao,
    }
    const items = prescription.items.filter(hasContent)
    setPrescription({ ...prescription, items: [...items, added] })
    setTargetItem(items.length)
    const isMgPerMl = item.unidadeConcentracao.toLowerCase().replaceAll(' ', '') === 'mg/ml'
    resetDose(isMgPerMl ? String(item.concentracao) : '')
    setMedQuery('')
  }

  function selectTarget(index: number) {
    setTargetItem(index)
    resetDose()
  }

  function applyDose() {
    if (!dog) {
      setDoseFeedback({
        inputs: doseInputs,
        text: 'Busque e selecione o animal antes de aplicar a dose.',
        error: true,
      })
      return
    }
    const applied = applyDoseToPrescription(prescription, targetItem, weight, mgKg, concentration)
    if (!applied.error) setPrescription(applied.prescription)
    setDoseFeedback({
      inputs: doseInputs,
      text:
        applied.error ||
        `Dose aplicada a ${prescription.items[targetItem].medication}: ${applied.dose}. O campo Dose por administração foi preenchido na receita abaixo.`,
      error: !!applied.error,
    })
  }

  function changePrescription(value: Prescription) {
    setPrescription(value)
    if (value.items.length !== prescription.items.length) {
      setTargetItem(0)
      resetDose()
    }
  }

  return {
    dog,
    vet,
    vetId,
    weight,
    patient,
    prescription,
    previewPrescription,
    medQuery,
    setMedQuery,
    mgKg,
    setMgKg,
    concentration,
    setConcentration,
    targetItem,
    calculation: calculateDose(decimalValue(weight), decimalValue(mgKg), decimalValue(concentration)),
    doseFeedback: doseFeedback?.inputs === doseInputs ? doseFeedback : null,
    hasValidWeight: Number.isFinite(decimalValue(weight)) && decimalValue(weight) > 0,
    reset,
    selectDog,
    changeWeight,
    selectVet,
    addMedication,
    selectTarget,
    applyDose,
    changePrescription,
  }
}

export type PrescriptionDraft = ReturnType<typeof usePrescriptionDraft>
