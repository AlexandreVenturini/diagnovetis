import { useMemo, useState } from 'react'
import type { StudentOption } from '../supervisionTypes'

type ParticipantsPickerProps = {
  students: StudentOption[]
  selected: string[]
  onToggle: (profileId: string) => void
  disabled: boolean
}

export function ParticipantsPicker({ students, selected, onToggle, disabled }: ParticipantsPickerProps) {
  const [query, setQuery] = useState('')

  const filteredStudents = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('pt-BR')
    return students.filter((student) =>
      `${student.nome} ${student.matricula}`.toLocaleLowerCase('pt-BR').includes(normalized),
    )
  }, [students, query])

  return (
    <fieldset className="supervision-participants" disabled={disabled}>
      <legend>Alunos participantes ({selected.length})</legend>
      {students.length === 0 ? (
        <p className="supervision-muted">Nenhum outro estudante cadastrado.</p>
      ) : (
        <>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome ou matrícula"
            className="supervision-search"
          />
          <div className="supervision-student-list">
            {filteredStudents.map((student) => (
              <label key={student.profileId} className="supervision-student">
                <input
                  type="checkbox"
                  checked={selected.includes(student.profileId)}
                  onChange={() => onToggle(student.profileId)}
                />
                {student.nome}
                {student.matricula && <small>· {student.matricula}</small>}
              </label>
            ))}
            {filteredStudents.length === 0 && <p className="supervision-muted">Nenhum estudante encontrado.</p>}
          </div>
        </>
      )}
    </fieldset>
  )
}
