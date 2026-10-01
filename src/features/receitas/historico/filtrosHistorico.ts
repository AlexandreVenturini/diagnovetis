import type { ReceitaEmitida } from '../../../services/ReceitaService'
import {
  dataParaCampo,
  noIntervalo,
  limitesPeriodo,
  rotuloPeriodo,
  intervaloPeriodo,
  deslocarPeriodo,
  type VisaoPeriodo,
} from '../../shared/periodo'

export type VisaoHistorico = VisaoPeriodo
export type FiltrosHistorico = {
  visao: VisaoHistorico
  data: string
  busca: string
  veterinario: string
  medicamento: string
}
export { dataParaCampo, limitesPeriodo, rotuloPeriodo, deslocarPeriodo }

export function filtrarHistoricoReceitas(historico: ReceitaEmitida[], filtros: FiltrosHistorico) {
  const busca = filtros.busca.trim().toLocaleLowerCase('pt-BR')
  const intervalo = busca ? null : intervaloPeriodo({ visao: filtros.visao, data: filtros.data })
  return historico.filter((linha) => {
    const { paciente, receita, emitidaEm } = linha.snapshot
    const dataEmissao = dataParaCampo(new Date(emitidaEm))
    const medicamentos = receita.itens.map((item) => item.medicamento)
    const pesquisavel =
      `${paciente.nomePet} ${paciente.nomeTutor} ${paciente.veterinario} ${receita.crmv} ${medicamentos.join(' ')}`.toLocaleLowerCase(
        'pt-BR',
      )
    return (
      noIntervalo(dataEmissao, intervalo) &&
      pesquisavel.includes(busca) &&
      (!filtros.veterinario || paciente.veterinario === filtros.veterinario) &&
      (!filtros.medicamento || medicamentos.includes(filtros.medicamento))
    )
  })
}
