import { noIntervalo, type Intervalo, type VisaoPeriodo } from '../../shared/periodo'
import type { Agendamento, SituacaoAgendamento } from '../agendaTipos'

export const ROTULOS_SITUACAO: Record<SituacaoAgendamento, string> = {
  confirmed: 'Confirmado',
  waiting: 'Aguardando',
  'in-progress': 'Em atendimento',
  completed: 'Concluído',
  'no-show': 'Faltou',
  cancelled: 'Cancelado',
}

export type FiltrosAgenda = {
  busca: string
  veterinario: string
  servico: string
  status: SituacaoAgendamento | 'todos'
}

export function formatarDataAgenda(data: string) {
  if (!data) return 'Data não informada'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(`${data}T12:00:00`),
  )
}

export function paraCampoData(data: Date) {
  const deslocamento = data.getTimezoneOffset()
  return new Date(data.getTime() - deslocamento * 60_000).toISOString().slice(0, 10)
}

export const valoresUnicos = (valores: string[]) => [...new Set(valores.filter(Boolean))]

export function filtrarAgendamentos(agendamentos: Agendamento[], filtros: FiltrosAgenda) {
  const busca = filtros.busca.trim().toLocaleLowerCase('pt-BR')
  return agendamentos.filter(
    (agendamento) =>
      (!busca || `${agendamento.nomePet} ${agendamento.nomeTutor}`.toLocaleLowerCase('pt-BR').includes(busca)) &&
      (filtros.veterinario === 'todos' || agendamento.veterinario === filtros.veterinario) &&
      (filtros.servico === 'todos' || agendamento.tipoServico === filtros.servico) &&
      (filtros.status === 'todos' || agendamento.status === filtros.status),
  )
}

export function agendamentosNoPeriodo(agendamentos: Agendamento[], intervalo: Intervalo | null, visao: VisaoPeriodo) {
  return agendamentos
    .filter((agendamento) =>
      agendamento.data ? noIntervalo(agendamento.data, intervalo) : visao === 'dia' || !intervalo,
    )
    .sort((a, b) => `${a.data}${a.horario}`.localeCompare(`${b.data}${b.horario}`))
}

export function lembretesPendentes(agendamentos: Agendamento[]) {
  return agendamentos
    .flatMap((agendamento) =>
      agendamento.lembretes.filter((lembrete) => !lembrete.concluido).map((lembrete) => ({ agendamento, lembrete })),
    )
    .sort((a, b) => a.lembrete.data.localeCompare(b.lembrete.data))
}

export function temConflitoLocal(agendamentos: Agendamento[], alvo: Agendamento, data: string, horario: string) {
  return agendamentos.some(
    (item) =>
      item.id !== alvo.id &&
      item.status !== 'cancelled' &&
      item.veterinario === alvo.veterinario &&
      item.data === data &&
      item.horario === horario,
  )
}
