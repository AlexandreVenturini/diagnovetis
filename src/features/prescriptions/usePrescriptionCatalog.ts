import { useEffect, useState } from 'react'
import type { Medico } from '../../models/Medico'
import type { Medicamento } from '../../models/Medicamento'
import { MedicoService } from '../../services/MedicoService'
import { MedicamentoService } from '../../services/MedicamentoService'

export function usePrescriptionCatalog() {
  const [medicos, setMedicos] = useState<Medico[]>([])
  const [medications, setMedications] = useState<Medicamento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let active = true
    Promise.all([new MedicoService().listarMedicos(), new MedicamentoService().listarMedicamentos()])
      .then(([vets, meds]) => {
        if (!active) return
        setMedicos(vets)
        setMedications(meds)
        setError('')
        setLoading(false)
      })
      .catch((reason) => {
        if (!active) return
        setError(reason.message)
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [reload])

  function retry() {
    setLoading(true)
    setReload((value) => value + 1)
  }

  return { medicos, medications, loading, error, retry }
}
