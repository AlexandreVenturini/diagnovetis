import { useEffect, useState } from 'react'
import { listarEstudantes, listarVeterinarios } from '../supervision'
import type { StudentOption, VeterinarianOption } from '../supervisionTypes'

export function useSupervisionOptions(onError: (message: string) => void) {
  const [veterinarians, setVeterinarians] = useState<VeterinarianOption[]>([])
  const [students, setStudents] = useState<StudentOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([listarVeterinarios(), listarEstudantes()])
      .then(([vets, studs]) => {
        if (!active) return
        setVeterinarians(vets)
        setStudents(studs)
      })
      .catch(() => {
        if (active) onError('Não foi possível carregar os professores e estudantes. Tente novamente.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [onError])

  return { veterinarians, students, loading }
}
