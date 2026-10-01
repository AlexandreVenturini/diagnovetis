import { useEffect, useState } from 'react'
import type { Medico } from '../../models/Medico'
import type { Medicamento } from '../../models/Medicamento'
import { MedicoService } from '../../services/MedicoService'
import { MedicamentoService } from '../../services/MedicamentoService'

export function useCatalogoReceita() {
  const [medicos, setMedicos] = useState<Medico[]>([])
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [recarga, setRecarga] = useState(0)

  useEffect(() => {
    let ativo = true
    Promise.all([new MedicoService().listarMedicos(), new MedicamentoService().listarMedicamentos()])
      .then(([listaVeterinarios, listaMedicamentos]) => {
        if (!ativo) return
        setMedicos(listaVeterinarios)
        setMedicamentos(listaMedicamentos)
        setErro('')
        setCarregando(false)
      })
      .catch((motivo) => {
        if (!ativo) return
        setErro(motivo.message)
        setCarregando(false)
      })
    return () => {
      ativo = false
    }
  }, [recarga])

  function tentarNovamente() {
    setCarregando(true)
    setRecarga((valor) => valor + 1)
  }

  return { medicos, medicamentos, carregando, erro, tentarNovamente }
}
