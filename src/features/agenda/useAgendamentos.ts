import { useCallback, useEffect, useState } from 'react'
import { AgendamentoService } from '../../services/AgendamentoService'
import type { Intervalo } from '../shared/periodo'
import { useDadosPorIntervalo } from '../shared/useDadosPorIntervalo'
import type { Agendamento, DadosFormularioAgendamento } from './agendaTipos'

const agendamentoService = new AgendamentoService()
const buscarAgendamentos = (intervalo: Intervalo | null) => agendamentoService.listar(intervalo)

export function useAgendamentos(intervalo: Intervalo | null = null) {
  const {
    itens: agendamentos,
    carregando,
    erro,
    recarregar,
    inserirOuAtualizar,
  } = useDadosPorIntervalo(buscarAgendamentos, (item: Agendamento) => item.id, intervalo)
  const [agendamentosComLembrete, setAgendamentosComLembrete] = useState<Agendamento[]>([])

  const recarregarLembretes = useCallback(async () => {
    setAgendamentosComLembrete(await agendamentoService.listarComLembretes().catch(() => []))
  }, [])

  useEffect(() => {
    let ativo = true
    agendamentoService
      .listarComLembretes()
      .then((linhas) => {
        if (ativo) setAgendamentosComLembrete(linhas)
      })
      .catch(() => {})
    return () => {
      ativo = false
    }
  }, [])

  const temConflito = useCallback(
    (veterinario: string, dados: string, horario: string, idIgnorado?: number) =>
      agendamentoService.temConflito(veterinario, dados, horario, idIgnorado),
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
      const atual = agendamentos.find((item) => item.id === id)
      if (atual) inserirOuAtualizar([{ ...atual, ...alteracoes }])
      else await recarregar()
      if (alteracoes.lembretes !== undefined) await recarregarLembretes()
      return true
    },
    [agendamentos, inserirOuAtualizar, recarregar, recarregarLembretes],
  )

  return {
    agendamentos,
    agendamentosComLembrete,
    carregando,
    erro,
    temConflito,
    criarAgendamento,
    atualizarAgendamento,
  }
}
