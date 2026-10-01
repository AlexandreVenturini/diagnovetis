import { Icone } from '../../components/common/Icone'
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
      <div className="records-heading">
        <div>
          <h2>Prontuários Clínicos</h2>
          <p>
            {papel === 'attendant'
              ? 'Consulte o histórico completo dos pacientes. Correções em atendimentos precisam da autorização de um professor.'
              : 'Consulte o histórico completo dos pacientes.'}
          </p>
        </div>
        <div className="records-stat">
          <strong>{pacientes.length}</strong>
          <span>{buscando ? 'pacientes encontrados' : `pacientes atendidos ${nomePeriodo(periodo.visao)}`}</span>
        </div>
      </div>

      <FiltroPeriodo rotulo="Período dos atendimentos" valor={periodo} aoAlterar={aoAlterarPeriodo} buscando={buscando}>
        <label className="agenda-search">
          <span>Buscar paciente</span>
          <span className="record-search record-search--inline">
            <Icone>
              <circle cx="11" cy="11" r="7" />
              <path d="m16 16 5 5" />
            </Icone>
            <input
              value={busca}
              onChange={(evento) => aoAlterarBusca(evento.target.value)}
              placeholder="Nome do animal ou tutor"
            />
          </span>
        </label>
      </FiltroPeriodo>

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
