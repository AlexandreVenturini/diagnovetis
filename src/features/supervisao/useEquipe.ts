import { useQuery } from '@tanstack/react-query'
import { SupervisaoService } from '../../services/SupervisaoService'
import { CHAVES } from '../shared/consultas'

const supervisaoService = new SupervisaoService()

export function useVeterinarios() {
  return useQuery({ queryKey: CHAVES.veterinarios, queryFn: () => supervisaoService.listarVeterinarios() })
}

export function useEstudantes() {
  return useQuery({ queryKey: CHAVES.estudantes, queryFn: () => supervisaoService.listarEstudantes() })
}
