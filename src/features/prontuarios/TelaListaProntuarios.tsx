import { CabecalhoTela } from '../../components/common/CabecalhoTela'
import { CampoBusca } from '../../components/common/CampoBusca'
import { CabecalhoLista } from '../../components/common/CabecalhoLista'
import type { Papel } from '../acesso/perfil'
import { FiltroPeriodo } from '../shared/FiltroPeriodo'
import { nomePeriodo, type Periodo } from '../shared/periodo'
import { ListaProntuarios } from './ListaProntuarios'
import type { ResumoProntuario } from './ListaProntuarios'

type TelaListaProntuariosProps = {
  papel: Papel
  pacientes: ResumoProntuario[]
  carregando: boolean
  erro: string
  periodo: Periodo
  aoAlterarPeriodo: (periodo: Periodo) => void
  busca: string
  aoAlterarBusca: (busca: string) => void
  aoSelecionar: (paciente: ResumoProntuario) => void
}

export function TelaListaProntuarios({
  papel,
  pacientes,
  carregando,
  erro,
  periodo,
  aoAlterarPeriodo,
  busca,
  aoAlterarBusca,
  aoSelecionar,
}: TelaListaProntuariosProps) {
  const buscando = Boolean(busca.trim())
  return (
    <section className="records-module">
      <CabecalhoTela
        titulo="Prontuários Clínicos"
        descricao={
          papel === 'attendant'
            ? 'Consulte o histórico completo dos pacientes. Correções em atendimentos precisam da autorização de um professor.'
            : 'Consulte o histórico completo dos pacientes.'
        }
      />

      <FiltroPeriodo rotulo="Período dos atendimentos" valor={periodo} aoAlterar={aoAlterarPeriodo} buscando={buscando}>
        <CampoBusca valor={busca} aoAlterar={aoAlterarBusca} placeholder="Animal ou responsável" />
      </FiltroPeriodo>

      <CabecalhoLista
        titulo={buscando ? 'Resultado da busca' : `Atendidos ${nomePeriodo(periodo.visao)}`}
        contagem={`${pacientes.length} paciente(s)`}
      />
      {erro && <div className="empty-appointments">{erro}</div>}
      {carregando ? (
        <div className="empty-appointments">Carregando prontuários...</div>
      ) : (
        <ListaProntuarios
          pacientes={pacientes}
          textoVazio={
            buscando ? 'Nenhum paciente encontrado com esse nome.' : 'Nenhum paciente atendido neste período.'
          }
          aoSelecionar={aoSelecionar}
        />
      )}
    </section>
  )
}
