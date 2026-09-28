import { useCallback, useEffect, useMemo, useState } from 'react'
import { Icon } from '../../components/common/Icon'
import { PetService } from '../../services/PetService'
import { ConsultaService } from '../../services/ConsultaService'
import { PatientList } from './PatientList'
import { PatientDetails } from './PatientDetails'
import { RetificationEditor } from './RetificationEditor'
import type { ClinicalRecord, PatientRecord, RecordKind } from './recordTypes'
import type { Exame } from '../../models/Exame'
import type { UserRole } from '../auth/LoginPage'

const petService = new PetService()
const consultaService = new ConsultaService()

type Screen = 'list' | 'details' | 'retify'

async function fetchPatients(): Promise<PatientRecord[]> {
  const [pets, todasConsultas] = await Promise.all([petService.listarPets(), consultaService.listarConsultas()])
  const consultasPorPet = new Map<number, typeof todasConsultas>()
  for (const consulta of todasConsultas) {
    consultasPorPet.set(consulta.pet.id, [...(consultasPorPet.get(consulta.pet.id) ?? []), consulta])
  }
  return pets.map((pet) => {
      const consultas = consultasPorPet.get(pet.id) ?? []
      const records: ClinicalRecord[] = consultas.map((c) => ({
        id: c.id,
        kind: 'Consulta' as RecordKind,
        date: c.dataConsulta.toISOString().slice(0, 10),
        veterinarian: c.responsavel.nome,
        crmv: (c.responsavel as { crmv?: string }).crmv ?? '',
        students: [...c.alunos.map((a) => a.nome), ...c.participantes.filter((p) => p.papel !== 'supervisor' && p.nome !== c.supervisorNome).map((p) => p.nome)],
        description: c.observacoes ?? '',
        diagnosis: c.diagnostico ?? '',
        conduct: c.conduta,
        complementaryExams: c.exames,
        exams: c.exames.map((e) => e.nomeExame),
        attachments: [],
        savedPrescription: c.prescricao,
        prescriptions: c.prescricao
          ? c.prescricao.prescription.items.map(
              (item) => `${item.medication} — ${item.dose}; ${item.route}; ${item.frequency}; ${item.duration}; quantidade: ${item.quantity}`
            )
          : c.receitas.flatMap((r) =>
              r.medicamentosReceitados.map((m) => `${m.medicamento.nome} — ${m.dose}`)
            ),
        validation: 'validated' as const,
        validatedBy: c.supervisorNome || c.responsavel.nome,
        exameFisico: c.exameFisico,
        alta: c.alta,
        versao: c.versao,
        retificadoEm: c.retificadoEm,
        retificadoPorNome: c.retificadoPorNome,
      }))

      const e = pet.tutor.endereco
      return {
        id: pet.id,
        dogName: pet.nome,
        tutorName: pet.tutor.nome,
        tutorCpf: pet.tutor.cpf ?? '',
        tutorPhone: pet.tutor.telefone ?? '',
        tutorEmail: pet.tutor.email ?? '',
        tutorAddress: e ? `${e.rua}, ${e.numero}${e.bairro ? ` — ${e.bairro}` : ''}` : '',
        tutorCity: e ? `${e.cidade}/${e.uf}` : '',
        breed: pet.raca,
        age: pet.idade,
        sex: pet.sexo,
        allergies: [],
        previousDiseases: pet.historico ? [pet.historico] : [],
        vaccines: [],
        weights: pet.peso
          ? [{ date: new Date().toISOString().slice(0, 10), weight: parseFloat(pet.peso) || 0 }]
          : [],
        records,
      }
    })
}

export function RecordsModule({ initialPetId, role = 'veterinarian' }: { initialPetId?: number; role?: UserRole }) {
  const [patients, setPatients] = useState<PatientRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [screen, setScreen] = useState<Screen>(initialPetId ? 'details' : 'list')
  const [selectedId, setSelectedId] = useState<number | null>(initialPetId ?? null)
  const [query, setQuery] = useState('')
  const [retifyId, setRetifyId] = useState<number | null>(null)
  const [detailsNotice, setDetailsNotice] = useState('')
  const [detailsKey, setDetailsKey] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setPatients(await fetchPatients())
    } catch {
      setPatients([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load().catch(() => {}) }, [load]) // eslint-disable-line react-hooks/set-state-in-effect

  const selected = patients.find((p) => p.id === selectedId) ?? null

  const filtered = useMemo(
    () => patients.filter((p) =>
      `${p.dogName} ${p.tutorName}`.toLocaleLowerCase('pt-BR').includes(query.trim().toLocaleLowerCase('pt-BR'))
    ),
    [patients, query]
  )

  function openPatient(patient: PatientRecord) {
    setRetifyId(null)
    setDetailsNotice('')
    setSelectedId(patient.id)
    setScreen('details')
  }

  function openRetification(recordId: number) {
    setRetifyId(recordId)
    setDetailsNotice('')
    setScreen('retify')
  }

  async function handleRetified(message: string) {
    await load()
    setDetailsNotice(message)
    setDetailsKey((prev) => prev + 1)
    setScreen('details')
  }

  function handleExamSaved(exam: Exame) {
    setPatients((prev) =>
      prev.map((p) =>
        p.id === selectedId
          ? {
              ...p,
              records: p.records.map((r) =>
                r.id === exam.consultaId
                  ? { ...r, complementaryExams: r.complementaryExams?.map((e) => (e.id === exam.id ? exam : e)) }
                  : r
              ),
            }
          : p
      )
    )
  }

  if (loading) {
    return <section className="records-module"><div className="empty-appointments">Carregando prontuários...</div></section>
  }

  if (screen === 'list') {
    return (
      <section className="records-module">
        <div className="records-heading">
          <div>
            <h2>Prontuários Clínicos</h2>
            <p>{role === 'attendant' ? 'Consulte o histórico completo dos pacientes. Correções em atendimentos precisam da autorização de um professor.' : 'Consulte o histórico completo dos pacientes.'}</p>
          </div>
          <div className="records-stat">
            <strong>{patients.length}</strong>
            <span>pacientes acompanhados</span>
          </div>
        </div>

        <div className="record-search content-card">
          <Icon><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></Icon>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome do animal ou tutor..."
          />
        </div>

        <PatientList patients={filtered} onSelect={openPatient} />
      </section>
    )
  }

  if (!selected) return null

  if (screen === 'retify' && retifyId !== null) {
    return (
      <RetificationEditor
        consultaId={retifyId}
        role={role}
        onDone={(message) => { void handleRetified(message) }}
        onCancel={() => setScreen('details')}
      />
    )
  }

  return (
    <PatientDetails
      key={detailsKey}
      selected={selected}
      onBack={() => { setDetailsNotice(''); setScreen('list') }}
      onExamSaved={handleExamSaved}
      onRetify={openRetification}
      canEditExams={role === 'veterinarian'}
      initialRecordId={retifyId ?? undefined}
      initialNotice={detailsNotice}
    />
  )
}
