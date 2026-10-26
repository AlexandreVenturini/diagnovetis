import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CHAVES } from '../shared/consultas'
import { listarEmAndamento } from './salvarAtendimento'

export function useAtendimentosEmAndamento() {
  const cliente = useQueryClient()
  const consulta = useQuery({ queryKey: CHAVES.atendimentosEmAndamento, queryFn: () => listarEmAndamento() })

  return {
    itens: consulta.data ?? [],
    carregando: consulta.isPending,
    erro: consulta.error?.message ?? '',
    recarregar: () => cliente.invalidateQueries({ queryKey: CHAVES.atendimentosEmAndamento }),
  }
}
