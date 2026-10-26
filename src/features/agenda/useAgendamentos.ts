import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AgendamentoService } from '../../services/AgendamentoService'
import { CHAVES } from '../shared/consultas'
import type { Intervalo } from '../shared/periodo'
import { useDadosPorPeriodo } from '../shared/useDadosPorPeriodo'
import type { Agendamento, DadosFormularioAgendamento } from './agendaTipos'

const agendamentoService = new AgendamentoService()
const buscarAgendamentos = (intervalo: Intervalo | null) => agendamentoService.listar(intervalo)
const chaveAgendamento = (item: Agendamento) => item.id
const CHAVE_LEMBRETES = [...CHAVES.agendamentos, 'lembretes']

export function useAgendamentos(intervalo: Intervalo | null = null) {
  const cliente = useQueryClient()
  const dados = useDadosPorPeriodo(CHAVES.agendamentos, buscarAgendamentos, chaveAgendamento, intervalo)
  const lembretes = useQuery({
    queryKey: CHAVE_LEMBRETES,
    queryFn: () => agendamentoService.listarComLembretes().catch(() => []),
  })
  const { inserirOuAtualizar, recarregar } = dados

  const temConflito = useCallback(
    (veterinario: string, dia: string, horario: string, idIgnorado?: number) =>
      agendamentoService.temConflito(veterinario, dia, horario, idIgnorado),
    [],
  )

  const criarAgendamento = useCallback(
    async (data: DadosFormularioAgendamento): Promise<boolean> => {
      if (data.tipo === 'scheduled' && (await temConflito(data.veterinario, data.data, data.horario))) return false
      const criado = await agendamentoService.criar(data)
      if (!criado) return false
      inserirOuAtualizar([criado])
      return true
    },
    [temConflito, inserirOuAtualizar],
  )

  const atualizarAgendamento = useCallback(
    async (id: number, alteracoes: Partial<Agendamento>) => {
      if (!(await agendamentoService.atualizar(id, alteracoes))) return false
      cliente.setQueriesData<Agendamento[]>({ queryKey: CHAVES.agendamentos }, (atual) =>
        atual?.map((item) => (item.id === id ? { ...item, ...alteracoes } : item)),
      )
      void recarregar()
      return true
    },
    [cliente, recarregar],
  )

  return {
    agendamentos: dados.itens,
    agendamentosComLembrete: lembretes.data ?? [],
    carregando: dados.carregando,
    atualizando: dados.atualizando || lembretes.isFetching,
    erro: dados.erro,
    atualizadoEm: dados.atualizadoEm,
    atualizarTudo: recarregar,
    temConflito,
    criarAgendamento,
    atualizarAgendamento,
  }
}
