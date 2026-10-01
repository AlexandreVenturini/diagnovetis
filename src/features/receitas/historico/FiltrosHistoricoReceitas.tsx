import type { ReceitaEmitida } from '../../../services/ReceitaService'
import { FiltroPeriodo } from '../../shared/FiltroPeriodo'
import type { FiltrosHistorico } from './filtrosHistorico'

export function FiltrosHistoricoReceitas({
  historico,
  valor,
  aoAlterar,
}: {
  historico: ReceitaEmitida[]
  valor: FiltrosHistorico
  aoAlterar: (valor: FiltrosHistorico) => void
}) {
  const veterinarios = [...new Set(historico.map((linha) => linha.snapshot.paciente.veterinario).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, 'pt-BR'),
  )
  const medicamentos = [
    ...new Set(
      historico.flatMap((linha) => linha.snapshot.receita.itens.map((item) => item.medicamento)).filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  return (
    <FiltroPeriodo
      rotulo="Período do histórico de receitas"
      valor={{ visao: valor.visao, data: valor.data }}
      aoAlterar={(periodo) => aoAlterar({ ...valor, ...periodo })}
      buscando={Boolean(valor.busca.trim())}
    >
      <label>
        <span>Buscar receitas</span>
        <input
          value={valor.busca}
          onChange={(evento) => aoAlterar({ ...valor, busca: evento.target.value })}
          placeholder="Animal, responsável, veterinário ou medicamento"
        />
      </label>
      <label>
        <span>Veterinário</span>
        <select
          value={valor.veterinario}
          onChange={(evento) => aoAlterar({ ...valor, veterinario: evento.target.value })}
        >
          <option value="">Todos</option>
          {veterinarios.map((nome) => (
            <option key={nome} value={nome}>
              {nome}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Medicamento</span>
        <select
          value={valor.medicamento}
          onChange={(evento) => aoAlterar({ ...valor, medicamento: evento.target.value })}
        >
          <option value="">Todos</option>
          {medicamentos.map((nome) => (
            <option key={nome} value={nome}>
              {nome}
            </option>
          ))}
        </select>
      </label>
    </FiltroPeriodo>
  )
}
