export type ResumoProntuario = {
  id: number
  nomePet: string
  nomeTutor: string
  raca: string
  peso: string
  totalAtendimentos: number
  ultimoAtendimento: { data: string; veterinario: string } | null
}

function formatarData(data: string) {
  return new Date(`${data}T12:00:00`).toLocaleDateString('pt-BR')
}

type ListaProntuariosProps = {
  pacientes: ResumoProntuario[]
  aoSelecionar: (paciente: ResumoProntuario) => void
  textoVazio?: string
}

export function ListaProntuarios({
  pacientes,
  aoSelecionar,
  textoVazio = 'Nenhum prontuário encontrado.',
}: ListaProntuariosProps) {
  return (
    <div className="patient-record-grid">
      {pacientes.map((paciente) => (
        <button className="patient-record-card" key={paciente.id} onClick={() => aoSelecionar(paciente)}>
          <div className="patient-card-top">
            <div>
              <h3>{paciente.nomePet}</h3>
              <p>Responsável: {paciente.nomeTutor}</p>
            </div>
            <span>{paciente.totalAtendimentos} atendimento(s)</span>
          </div>

          <div className="patient-clinical-flags">
            <span>{paciente.raca}</span>
            <span>{paciente.peso || '-'} kg</span>
          </div>

          {paciente.ultimoAtendimento ? (
            <div className="latest-record">
              <span className="record-kind-icon kind-consulta">▤</span>
              <div>
                <small>Último atendimento</small>
                <strong>Consulta</strong>
                <span>
                  {formatarData(paciente.ultimoAtendimento.data)} · {paciente.ultimoAtendimento.veterinario}
                </span>
              </div>
            </div>
          ) : (
            <div className="latest-record">
              <small>Sem atendimentos registrados</small>
            </div>
          )}
        </button>
      ))}

      {pacientes.length === 0 && <div className="empty-appointments">{textoVazio}</div>}
    </div>
  )
}
