import { useMemo, useState } from 'react'
import type { OpcaoEstudante } from '../supervisao/supervisaoTipos'

type SeletorParticipantesProps = {
  estudantes: OpcaoEstudante[]
  selecionado: string[]
  aoAlternar: (idPerfil: string) => void
  desabilitado: boolean
}

export function SeletorParticipantes({ estudantes, selecionado, aoAlternar, desabilitado }: SeletorParticipantesProps) {
  const [busca, setBusca] = useState('')

  const estudantesFiltrados = useMemo(() => {
    const normalizado = busca.trim().toLocaleLowerCase('pt-BR')
    return estudantes.filter((estudante) =>
      `${estudante.nome} ${estudante.matricula}`.toLocaleLowerCase('pt-BR').includes(normalizado),
    )
  }, [estudantes, busca])

  return (
    <fieldset className="supervision-participants" disabled={desabilitado}>
      <legend>Alunos participantes ({selecionado.length})</legend>
      {estudantes.length === 0 ? (
        <p className="supervision-muted">Nenhum outro estudante cadastrado.</p>
      ) : (
        <>
          <input
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="Buscar por nome ou matrícula"
            className="supervision-search"
          />
          <div className="supervision-student-list">
            {estudantesFiltrados.map((estudante) => (
              <label key={estudante.idPerfil} className="supervision-student">
                <input
                  type="checkbox"
                  checked={selecionado.includes(estudante.idPerfil)}
                  onChange={() => aoAlternar(estudante.idPerfil)}
                />
                {estudante.nome}
                {estudante.matricula && <small>· {estudante.matricula}</small>}
              </label>
            ))}
            {estudantesFiltrados.length === 0 && <p className="supervision-muted">Nenhum estudante encontrado.</p>}
          </div>
        </>
      )}
    </fieldset>
  )
}
