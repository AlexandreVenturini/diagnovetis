import { useQuery } from '@tanstack/react-query'
import { MedicoService } from '../../services/MedicoService'
import { MedicamentoService } from '../../services/MedicamentoService'
import { CHAVES } from '../shared/consultas'

const medicoService = new MedicoService()
const medicamentoService = new MedicamentoService()

export function useCatalogoReceita() {
  const medicos = useQuery({ queryKey: CHAVES.medicos, queryFn: () => medicoService.listarMedicos() })
  const medicamentos = useQuery({
    queryKey: CHAVES.medicamentos,
    queryFn: () => medicamentoService.listarMedicamentos(),
  })
  const falha = medicos.error ?? medicamentos.error

  function tentarNovamente() {
    void medicos.refetch()
    void medicamentos.refetch()
  }

  return {
    medicos: medicos.data ?? [],
    medicamentos: medicamentos.data ?? [],
    carregando: medicos.isPending || medicamentos.isPending,
    erro: falha ? falha.message : '',
    tentarNovamente,
  }
}
