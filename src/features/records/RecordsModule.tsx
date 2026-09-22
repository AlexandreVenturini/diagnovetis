import { useCallback, useEffect, useMemo, useState } from 'react'
import { Icon } from '../../components/common/Icon'
import { PetService } from '../../services/PetService'
import { ConsultaService } from '../../services/ConsultaService'
import { PatientList } from './PatientList'
import { PatientDetails } from './PatientDetails'
import { RecordCreateForm } from './RecordCreateForm'
import type { ClinicalRecord, PatientRecord, RecordKind } from './recordTypes'
import type { Exame } from '../../models/Exame'

const petService = new PetService()
const consultaService = new ConsultaService()

type Screen = 'list' | 'details' | 'create'

async function fetchPatients(): Promise<PatientRecord[]> {
  const pets = await petService.listarPets()
  return Promise.all(
    pets.map(async (pet) => {
      const consultas = await consultaService.listarPorPet(pet.id)
      const records: ClinicalRecord[] = consultas.map((c) => ({
        id: c.id,
        kind: 'Consulta' as RecordKind,
        date: c.dataConsulta.toISOString().slice(0, 10),
        veterinarian: c.responsavel.nome,
        crmv: (c.responsavel as { crmv?: string }).crmv ?? '',
        students: c.alunos.map((a) => a.nome),
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
        validatedBy: c.responsavel.nome,
        exameFisico: c.exameFisico,
        alta: c.alta,
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
  )
}

export function RecordsModule({ initialPetId }: { initialPetId?: number }) {
  const [patients, setPatients] = useState<PatientRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [screen, setScreen] = useState<Screen>(initialPetId ? 'details' : 'list')
  const [selectedId, setSelectedId] = useState<number | null>(initialPetId ?? null)
  const [query, setQuery] = useState('')

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

  useEffect(() => { load() }, [load])

  const selected = patients.find((p) => p.id === selectedId) ?? null

  const filtered = useMemo(
    () => patients.filter((p) =>
      `${p.dogName} ${p.tutorName}`.toLocaleLowerCase('pt-BR').includes(query.trim().toLocaleLowerCase('pt-BR'))
    ),
    [patients, query]
  )

  function openPatient(patient: PatientRecord) {
    setSelectedId(patient.id)
    setScreen('details')
  }

  function handleRecordSave(record: ClinicalRecord, weight: string) {
    if (!selected) return
    setPatients((prev) =>
      prev.map((p) =>
        p.id === selected.id
          ? {
              ...p,
              records: [record, ...p.records],
              weights: weight ? [...p.weights, { date: record.date, weight: Number(weight) }] : p.weights,
            }
          : p
      )
    )
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

  const nextId = Math.max(0, ...patients.flatMap((p) => p.records.map((r) => r.id))) + 1

  if (loading) {
    return <section className="records-module"><div className="empty-appointments">Carregando prontuários...</div></section>
  }

  if (screen === 'list') {
    return (
      <section className="records-module">
        <div className="records-heading">
          <div>
            <h2>Prontuários Clínicos</h2>
            <p>Consulte o histórico completo dos pacientes.</p>
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

  if (screen === 'create') {
    return (
      <RecordCreateForm
        selected={selected}
        nextId={nextId}
        onSave={handleRecordSave}
        onCancel={() => setScreen('details')}
      />
    )
  }

  return (
    <PatientDetails
      selected={selected}
      onBack={() => setScreen('list')}
      onCreate={() => setScreen('create')}
      onExamSaved={handleExamSaved}
    />
  )
}
