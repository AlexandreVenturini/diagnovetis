import { useCallback, useEffect, useState } from 'react'
import type { Exame } from '../../models/Exame'
import { fetchPatient } from './recordData'
import type { PatientRecord } from './recordTypes'

export function usePatientRecord(initialPetId?: number) {
  const [patient, setPatient] = useState<PatientRecord | null>(null)
  const [loading, setLoading] = useState(Boolean(initialPetId))
  const [error, setError] = useState('')

  const load = useCallback(async (petId: number) => {
    setLoading(true)
    setError('')
    try {
      const found = await fetchPatient(petId)
      setPatient(found)
      if (!found) setError('Paciente não encontrado.')
    } catch {
      setError('Não foi possível carregar o prontuário.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialPetId === undefined) return
    let active = true
    fetchPatient(initialPetId)
      .then((found) => {
        if (!active) return
        setPatient(found)
        setError(found ? '' : 'Paciente não encontrado.')
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar o prontuário.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [initialPetId])

  function replaceExam(exam: Exame) {
    setPatient(
      (current) =>
        current && {
          ...current,
          records: current.records.map((record) =>
            record.id === exam.consultaId
              ? {
                  ...record,
                  complementaryExams: record.complementaryExams?.map((item) => (item.id === exam.id ? exam : item)),
                }
              : record,
          ),
        },
    )
  }

  return { patient, loading, error, load, clear: () => setPatient(null), replaceExam }
}
