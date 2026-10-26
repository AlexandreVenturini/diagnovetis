import type { ReceitaEmitida } from '../../../services/ReceitaService'
import { CampoBusca } from '../../../components/common/CampoBusca'
import { CampoSelecao } from '../../../components/common/CampoSelecao'
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
      <CampoBusca
        valor={valor.busca}
        aoAlterar={(busca) => aoAlterar({ ...valor, busca })}
        placeholder="Animal, responsável, veterinário ou medicamento"
      />
      <CampoSelecao
        rotulo="Veterinário"
        valor={valor.veterinario}
        aoAlterar={(veterinario) => aoAlterar({ ...valor, veterinario })}
        opcoes={veterinarios}
      />
      <CampoSelecao
        rotulo="Medicamento"
        valor={valor.medicamento}
        aoAlterar={(medicamento) => aoAlterar({ ...valor, medicamento })}
        opcoes={medicamentos}
      />
    </FiltroPeriodo>
  )
}
