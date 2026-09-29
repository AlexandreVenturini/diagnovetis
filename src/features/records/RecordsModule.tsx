import { useCallback, useEffect, useMemo, useState } from 'react'
import { Icon } from '../../components/common/Icon'
import { PetService } from '../../services/PetService'
import { ConsultaService } from '../../services/ConsultaService'
import type { Consulta } from '../../models/Consulta'
import type { Pet } from '../../models/Pet'
import { PatientList } from './PatientList'
import type { PatientSummary } from './PatientList'
import { PatientDetails } from './PatientDetails'
import { summarizePatients, type SummaryItem } from './patientSummaries'
import { RetificationEditor } from './RetificationEditor'
import { DeathForm } from './DeathForm'
import { buscarObito } from './death'
import type { ClinicalRecord, PatientRecord, RecordKind } from './recordTypes'
import type { Exame } from '../../models/Exame'
import type { UserRole } from '../auth/LoginPage'
import { PeriodFilter } from '../common/PeriodFilter'
import { usePeriod } from '../common/usePeriod'
import { useRangeData } from '../common/useRangeData'
import { periodNoun, periodRange, type DateRange } from '../common/period'

const petService = new PetService()
const consultaService = new ConsultaService()

type Screen = 'list' | 'details' | 'retify' | 'death'

function petInfo(pet: Pet): SummaryItem['pet'] {
  return { id: pet.id, dogName: pet.nome, tutorName: pet.tutor.nome, breed: pet.raca, weight: pet.peso }
}

async function fetchSummaries(range: DateRange | null): Promise<SummaryItem[]> {
  const resumos = await consultaService.listarResumo(range)
  const pets = range ? await petService.listarPorIds([...new Set(resumos.map((r) => r.petId))]) : await petService.listarPets()
  const petsPorId = new Map(pets.map((pet) => [pet.id, pet]))
  const items: SummaryItem[] = resumos
    .filter((r) => petsPorId.has(r.petId))
    .map((r) => ({ key: `c-${r.id}`, consultaId: r.id, date: r.date, veterinarian: r.veterinarian, pet: petInfo(petsPorId.get(r.petId)!) }))
  if (!range) {
    const comAtendimento = new Set(resumos.map((r) => r.petId))
    for (const pet of pets) {
      if (!comAtendimento.has(pet.id)) items.push({ key: `p-${pet.id}`, consultaId: null, date: '', veterinarian: '', pet: petInfo(pet) })
    }
  }
  return items
}

function buildPatientRecord(pet: Pet, consultas: Consulta[]): PatientRecord {
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
}

async function fetchPatient(petId: number): Promise<PatientRecord | null> {
  const [pets, consultas, death] = await Promise.all([petService.listarPorIds([petId]), consultaService.listarPorPet(petId), buscarObito(petId)])
  return pets[0] ? { ...buildPatientRecord(pets[0], consultas), death } : null
}

export function RecordsModule({ initialPetId, role = 'veterinarian', userEmail }: { initialPetId?: number; role?: UserRole; userEmail?: string }) {
  const [screen, setScreen] = useState<Screen>(initialPetId ? 'details' : 'list')
  const [selectedId, setSelectedId] = useState<number | null>(initialPetId ?? null)
  const [selected, setSelected] = useState<PatientRecord | null>(null)
  const [detailLoading, setDetailLoading] = useState(Boolean(initialPetId))
  const [detailError, setDetailError] = useState('')
  const [query, setQuery] = useState('')
  const [period, setPeriod] = usePeriod('prontuarios')
  const [retifyId, setRetifyId] = useState<number | null>(null)
  const [detailsNotice, setDetailsNotice] = useState('')
  const [detailsKey, setDetailsKey] = useState(0)

  const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR')
  const range = normalizedQuery ? null : periodRange(period)
  const summaries = useRangeData(fetchSummaries, (item: SummaryItem) => item.key, range)

  const patients = useMemo(() => summarizePatients(summaries.items, query, range), [summaries.items, query, range])

  const loadPatient = useCallback(async (petId: number) => {
    setDetailLoading(true)
    setDetailError('')
    try {
      const patient = await fetchPatient(petId)
      setSelected(patient)
      if (!patient) setDetailError('Paciente não encontrado.')
    } catch {
      setDetailError('Não foi possível carregar o prontuário.')
    } finally {
      setDetailLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialPetId === undefined) return
    let active = true
    fetchPatient(initialPetId)
      .then((patient) => {
        if (!active) return
        setSelected(patient)
        setDetailError(patient ? '' : 'Paciente não encontrado.')
      })
      .catch(() => { if (active) setDetailError('Não foi possível carregar o prontuário.') })
      .finally(() => { if (active) setDetailLoading(false) })
    return () => { active = false }
  }, [initialPetId])

  function openPatient(patient: PatientSummary) {
    setRetifyId(null)
    setDetailsNotice('')
    setSelected(null)
    setSelectedId(patient.id)
    setScreen('details')
    void loadPatient(patient.id)
  }

  function handleExamSaved(exam: Exame) {
    setSelected((current) => current && {
      ...current,
      records: current.records.map((r) =>
        r.id === exam.consultaId
          ? { ...r, complementaryExams: r.complementaryExams?.map((e) => (e.id === exam.id ? exam : e)) }
          : r
      ),
    })
  }

  function openRetification(recordId: number) {
    setRetifyId(recordId)
    setDetailsNotice('')
    setScreen('retify')
  }

  async function handleRetified(message: string) {
    if (selectedId !== null) await loadPatient(selectedId)
    void summaries.refresh().catch(() => {})
    setDetailsNotice(message)
    setDetailsKey((prev) => prev + 1)
    setScreen('details')
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
            <span>{normalizedQuery ? 'pacientes encontrados' : `pacientes atendidos ${periodNoun(period.view)}`}</span>
          </div>
        </div>

        <PeriodFilter label="Período dos atendimentos" value={period} onChange={setPeriod} searching={Boolean(normalizedQuery)}>
          <label className="agenda-search">
            <span>Buscar paciente</span>
            <span className="record-search" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Icon><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></Icon>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nome do animal ou tutor" />
            </span>
          </label>
        </PeriodFilter>

        {summaries.error && <div className="empty-appointments">{summaries.error}</div>}
        {summaries.loading
          ? <div className="empty-appointments">Carregando prontuários...</div>
          : <PatientList patients={patients} emptyText={normalizedQuery ? 'Nenhum paciente encontrado com esse nome.' : 'Nenhum paciente atendido neste período.'} onSelect={openPatient} />}
      </section>
    )
  }

  if (detailLoading) {
    return <section className="records-module"><div className="empty-appointments">Carregando prontuário...</div></section>
  }

  if (!selected) {
    return (
      <section className="records-module">
        <div className="empty-appointments">{detailError || 'Paciente não encontrado.'}</div>
        <button className="text-back-button" onClick={() => setScreen('list')}>‹ Prontuários</button>
      </section>
    )
  }

  if (screen === 'death') {
    return (
      <DeathForm
        petId={selected.id}
        dogName={selected.dogName}
        role={role}
        userEmail={userEmail}
        records={selected.records}
        existing={selected.death}
        onDone={(message) => { void handleRetified(message) }}
        onCancel={() => setScreen('details')}
      />
    )
  }

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
      onRegisterDeath={() => { setDetailsNotice(''); setScreen('death') }}
      onRetifyDeath={() => { setDetailsNotice(''); setScreen('death') }}
      canEditExams={role === 'veterinarian'}
      canRetifyDeath={role === 'veterinarian'}
      initialRecordId={retifyId ?? undefined}
      initialNotice={detailsNotice}
    />
  )
}
