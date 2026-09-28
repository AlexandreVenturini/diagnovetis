import { useEffect, useMemo, useState } from 'react'
import { liberarAtendimento, listarEstudantes, listarVeterinarios } from './supervision'
import type { Liberacao, StudentOption, VeterinarianOption } from './supervision'

type SupervisionGateProps = {
  onLiberado: (liberacao: Liberacao) => void
}

export function SupervisionGate({ onLiberado }: SupervisionGateProps) {
  const [veterinarians, setVeterinarians] = useState<VeterinarianOption[]>([])
  const [students, setStudents] = useState<StudentOption[]>([])
  const [loading, setLoading] = useState(true)
  const [supervisorId, setSupervisorId] = useState('')
  const [participants, setParticipants] = useState<string[]>([])
  const [studentQuery, setStudentQuery] = useState('')
  const [password, setPassword] = useState('')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([listarVeterinarios(), listarEstudantes()])
      .then(([vets, studs]) => {
        if (!active) return
        setVeterinarians(vets)
        setStudents(studs)
      })
      .catch(() => { if (active) setMessage('Não foi possível carregar os professores e estudantes. Tente novamente.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const filteredStudents = useMemo(() => {
    const query = studentQuery.trim().toLocaleLowerCase('pt-BR')
    return students.filter((student) => `${student.nome} ${student.matricula}`.toLocaleLowerCase('pt-BR').includes(query))
  }, [students, studentQuery])

  function toggleParticipant(profileId: string) {
    setParticipants((current) => current.includes(profileId) ? current.filter((id) => id !== profileId) : [...current, profileId])
  }

  async function submit() {
    if (sending) return
    const supervisor = veterinarians.find((vet) => vet.profileId === supervisorId)
    if (!supervisor) { setMessage('Selecione o professor responsável pela supervisão.'); return }
    if (!password) { setMessage('O professor precisa digitar a senha para liberar o atendimento.'); return }
    setSending(true)
    setMessage('')
    try {
      const id = await liberarAtendimento(supervisor.profileId, password, participants)
      setPassword('')
      if (!id) { setMessage('Senha incorreta. Peça ao professor para digitar novamente.'); return }
      onLiberado({ id, supervisor, participantes: students.filter((student) => participants.includes(student.profileId)) })
    } catch (error) {
      setPassword('')
      const text = (error as Error).message
      setMessage(text.includes('tentativas') ? text : 'Não foi possível liberar o atendimento. Tente novamente.')
    } finally {
      setSending(false)
    }
  }

  if (loading) return <section className="consultation-panel content-card"><p>Carregando professores e estudantes...</p></section>

  return (
    <section className="consultation-panel content-card">
      <h2>Liberação do atendimento</h2>
      <p>Antes de começar, escolha o professor responsável pela supervisão e os colegas que vão participar. O professor digita a própria senha para liberar o atendimento.</p>

      <div className="consultation-form-grid">
        <label>Professor supervisor *
          <select value={supervisorId} onChange={(event) => { setSupervisorId(event.target.value); setMessage('') }} disabled={sending}>
            <option value="">Selecione o professor</option>
            {veterinarians.map((vet) => <option key={vet.profileId} value={vet.profileId}>{vet.nome} — CRMV {vet.crmv}</option>)}
          </select>
        </label>
      </div>

      <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.75rem 1rem', margin: '1rem 0' }} disabled={sending}>
        <legend style={{ padding: '0 0.35rem', fontWeight: 600 }}>Alunos participantes ({participants.length})</legend>
        {students.length === 0 ? (
          <p style={{ margin: 0, color: '#6b7280' }}>Nenhum outro estudante cadastrado.</p>
        ) : (
          <>
            <input value={studentQuery} onChange={(event) => setStudentQuery(event.target.value)} placeholder="Buscar por nome ou matrícula" style={{ width: '100%', marginBottom: '0.5rem' }} />
            <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'grid', gap: '0.35rem' }}>
              {filteredStudents.map((student) => (
                <label key={student.profileId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 400 }}>
                  <input type="checkbox" checked={participants.includes(student.profileId)} onChange={() => toggleParticipant(student.profileId)} style={{ width: 'auto' }} />
                  {student.nome}{student.matricula && <small style={{ color: '#6b7280' }}>· {student.matricula}</small>}
                </label>
              ))}
              {filteredStudents.length === 0 && <p style={{ margin: 0, color: '#6b7280' }}>Nenhum estudante encontrado.</p>}
            </div>
          </>
        )}
      </fieldset>

      <div className="consultation-form-grid">
        <label>Senha do professor *
          <input
            type="password"
            name="supervisor-authorization"
            autoComplete="off"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') void submit() }}
            placeholder="Digitada pelo professor"
            disabled={sending}
          />
        </label>
      </div>

      {message && <p className="consultation-message" role="status">{message}</p>}
      <div className="consultation-next">
        <button className="primary-button" onClick={() => void submit()} disabled={sending || !supervisorId || !password}>
          {sending ? 'Verificando...' : 'Liberar atendimento'}
        </button>
      </div>
    </section>
  )
}
