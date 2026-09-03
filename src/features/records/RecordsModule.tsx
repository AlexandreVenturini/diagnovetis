import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Icon } from '../../components/common/Icon'
import { exportPatientRecord } from './recordReport'
import type { ClinicalRecord, PatientRecord, RecordKind, RecordScreen } from './recordTypes'
import { PetService } from '../../services/PetService'
import { ConsultaService } from '../../services/ConsultaService'

const petService = new PetService()
const consultaService = new ConsultaService()

const KIND_ICONS: Record<RecordKind, string> = { Consulta: '▤', Vacina: '+', Exame: '⚗', Tratamento: '∿', Retorno: '↻' }

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR')
}

function splitItems(value: string) {
  return value.split('\n').map((item) => item.trim()).filter(Boolean)
}

export function RecordsModule() {
  const recordFormRef = useRef<HTMLFormElement>(null)
  const [patients, setPatients] = useState<PatientRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [screen, setScreen] = useState<RecordScreen>('list')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')
  const [kind, setKind] = useState<RecordKind>('Consulta')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [veterinarian, setVeterinarian] = useState('')
  const [crmv, setCrmv] = useState('')
  const [students, setStudents] = useState('')
  const [description, setDescription] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [conduct, setConduct] = useState('')
  const [exams, setExams] = useState('')
  const [prescriptions, setPrescriptions] = useState('')
  const [attachments, setAttachments] = useState<string[]>([])
  const [weight, setWeight] = useState('')
  const [vaccinationRows, setVaccinationRows] = useState(1)
  const [treatmentRows, setTreatmentRows] = useState(1)
  const [evolutionRows, setEvolutionRows] = useState(0)

  const loadPatients = useCallback(async () => {
    setLoading(true)
    try {
      const pets = await petService.listarPets()
      const records: PatientRecord[] = await Promise.all(pets.map(async (pet) => {
        const consultas = await consultaService.listarPorPet(pet.id)
        const clinicalRecords: ClinicalRecord[] = consultas.map((c) => ({
          id: c.id,
          kind: 'Consulta' as RecordKind,
          date: c.dataConsulta.toISOString().slice(0, 10),
          veterinarian: c.responsavel.nome,
          crmv: (c.responsavel as { crmv?: string }).crmv ?? '',
          students: c.alunos.map((a) => a.nome),
          description: c.observacoes ?? '',
          diagnosis: c.diagnostico ?? '',
          conduct: '',
          exams: c.exames.map((e) => e.nomeExame),
          attachments: [],
          prescriptions: c.receitas.flatMap((r) => r.medicamentosReceitados.map((m) => `${m.medicamento.nome} — ${m.dose}`)),
          validation: 'validated' as const,
          validatedBy: c.responsavel.nome,
        }))
        const e = pet.tutor.endereco
        const enderecoStr = e ? `${e.rua}, ${e.numero}${e.bairro ? ` — ${e.bairro}` : ''}` : ''
        const cidadeUfStr = e ? `${e.cidade}/${e.uf}` : ''
        return {
          id: pet.id,
          dogName: pet.nome,
          tutorName: pet.tutor.nome,
          tutorCpf: pet.tutor.cpf ?? '',
          tutorPhone: pet.tutor.telefone ?? '',
          tutorEmail: pet.tutor.email ?? '',
          tutorAddress: enderecoStr,
          tutorCity: cidadeUfStr,
          breed: pet.raca,
          age: pet.idade,
          sex: pet.sexo,
          allergies: [],
          previousDiseases: pet.historico ? [pet.historico] : [],
          vaccines: [],
          weights: pet.peso ? [{ date: new Date().toISOString().slice(0, 10), weight: parseFloat(pet.peso) || 0 }] : [],
          records: clinicalRecords,
        }
      }))
      setPatients(records)
    } catch {
      setPatients([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadPatients() }, [loadPatients])

  const selected = patients.find((patient) => patient.id === selectedId) ?? null
  const filtered = useMemo(() => patients.filter((patient) => `${patient.dogName} ${patient.tutorName}`.toLocaleLowerCase('pt-BR').includes(query.trim().toLocaleLowerCase('pt-BR'))), [patients, query])

  function openPatient(patient: PatientRecord) { setSelectedId(patient.id); setScreen('details'); setNotice(''); setVaccinationRows(1); setTreatmentRows(1); setEvolutionRows(0) }

  function attachFiles(event: React.ChangeEvent<HTMLInputElement>) {
    setAttachments(Array.from(event.target.files ?? []).map((file) => file.name))
  }

  function saveRecord(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected) return
    const nextId = Math.max(0, ...patients.flatMap((patient) => patient.records.map((record) => record.id))) + 1
    const newRecord: ClinicalRecord = { id: nextId, kind, date, veterinarian, crmv, students: splitItems(students.replaceAll(',', '\n')), description, diagnosis, conduct, exams: splitItems(exams), attachments, prescriptions: splitItems(prescriptions), validation: 'pending', validatedBy: '' }
    setPatients((current) => current.map((patient) => patient.id === selected.id ? { ...patient, records: [newRecord, ...patient.records], weights: weight ? [...patient.weights, { date, weight: Number(weight) }] : patient.weights } : patient))
    setScreen('details'); setNotice('Registro salvo.'); setDescription(''); setDiagnosis(''); setConduct(''); setExams(''); setPrescriptions(''); setStudents(''); setAttachments([]); setWeight('')
  }

  if (loading) return <section className="records-module"><div className="empty-appointments">Carregando prontuários...</div></section>

  if (screen === 'list') return <section className="records-module">
    <div className="records-heading"><div><h2>Prontuários Clínicos</h2><p>Consulte o histórico completo dos pacientes.</p></div><div className="records-stat"><strong>{patients.length}</strong><span>pacientes acompanhados</span></div></div>
    <div className="record-search content-card"><Icon><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></Icon><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome do animal ou tutor..." /></div>
    <div className="patient-record-grid">{filtered.map((patient) => {
      const latest = [...patient.records].sort((a, b) => b.date.localeCompare(a.date))[0]
      const pending = patient.records.filter((record) => record.validation === 'pending').length
      return <button className="patient-record-card" key={patient.id} onClick={() => openPatient(patient)}>
        <div className="patient-card-top"><div><h3>{patient.dogName}</h3><p>Tutor: {patient.tutorName}</p></div><span>{patient.records.length} registros</span></div>
        <div className="patient-clinical-flags"><span>{patient.breed}</span><span>{patient.weights.at(-1)?.weight ?? '-'} kg</span>{patient.allergies.length > 0 && <span className="alert-flag">{patient.allergies.length} alergia(s)</span>}</div>
        {latest ? <div className="latest-record"><span className={`record-kind-icon kind-${latest.kind.toLowerCase()}`}>{KIND_ICONS[latest.kind]}</span><div><small>Último atendimento</small><strong>{latest.kind}</strong><span>{formatDate(latest.date)} · {latest.veterinarian}</span></div></div> : <div className="latest-record"><small>Sem atendimentos registrados</small></div>}
        {pending > 0 && <span className="pending-records">{pending} aguardando validação</span>}
      </button>
    })}{filtered.length === 0 && <div className="empty-appointments">Nenhum prontuário encontrado.</div>}</div>
  </section>

  if (!selected) return null

  if (screen === 'create') return <section className="record-form-card content-card">
    <div className="records-heading"><div><h2>Adicionar registro ao prontuário</h2><p>Paciente: <strong>{selected.dogName}</strong> · Tutor: {selected.tutorName}</p></div><button className="secondary-button" onClick={() => setScreen('details')}>Voltar</button></div>
    <form className="record-form" onSubmit={saveRecord}>
      <label>Tipo de registro<select value={kind} onChange={(event) => setKind(event.target.value as RecordKind)}>{Object.keys(KIND_ICONS).map((item) => <option key={item}>{item}</option>)}</select></label><label>Data<input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
      <label>Veterinário responsável<input value={veterinarian} onChange={(event) => setVeterinarian(event.target.value)} placeholder="Nome do profissional" required /></label><label>CRMV<input value={crmv} onChange={(event) => setCrmv(event.target.value)} placeholder="CRMV-ES 0000" required /></label>
      <label className="full-field">Alunos participantes<input value={students} onChange={(event) => setStudents(event.target.value)} placeholder="Separe os nomes por vírgulas" /></label>
      <label className="full-field">Descrição clínica<textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Anamnese, sinais clínicos e detalhes do atendimento" required /></label>
      <label>Diagnóstico<textarea value={diagnosis} onChange={(event) => setDiagnosis(event.target.value)} placeholder="Diagnóstico ou hipótese diagnóstica" /></label><label>Conduta<textarea value={conduct} onChange={(event) => setConduct(event.target.value)} placeholder="Tratamento, orientações e acompanhamento" /></label>
      <label>Exames solicitados ou realizados<textarea value={exams} onChange={(event) => setExams(event.target.value)} placeholder="Um exame por linha" /></label><label>Prescrições e receitas<textarea value={prescriptions} onChange={(event) => setPrescriptions(event.target.value)} placeholder="Medicamento, dose, frequência e duração" /></label>
      <label>Peso atual (kg)<input type="number" min="0" step="0.1" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="Ex.: 28,5" /></label><label>Anexos<input className="record-file-input" type="file" multiple onChange={attachFiles} /><span className="file-help">{attachments.length ? attachments.join(', ') : 'PDFs, imagens ou resultados de exames'}</span></label>
      <div className="record-validation-notice full-field"><span>✓</span><p><strong>Fluxo de validação</strong>Este registro será salvo como "Aguardando validação" até a confirmação do profissional responsável.</p></div>
      <div className="form-actions full-field"><button className="primary-button" type="submit">Salvar registro</button><button className="secondary-button" type="button" onClick={() => setScreen('details')}>Cancelar</button></div>
    </form>
  </section>

  const latestWeight = selected.weights.at(-1)?.weight
  const latestRecord = [...selected.records].sort((a, b) => b.date.localeCompare(a.date))[0]
  const emptyRecord: ClinicalRecord = { id: 0, kind: 'Consulta', date: '', veterinarian: '', crmv: '', students: [], description: '', diagnosis: '', conduct: '', exams: [], attachments: [], prescriptions: [], validation: 'pending', validatedBy: '' }
  const displayRecord = latestRecord ?? emptyRecord

  return <section className="record-details-module">
    <div className="records-heading record-detail-heading"><div><button className="text-back-button" onClick={() => setScreen('list')}>‹ Prontuários</button><h2>{selected.dogName}</h2><p>Tutor: {selected.tutorName} · {selected.breed} · {selected.age}</p></div><div className="record-header-actions"><button className="outline-button" onClick={() => { const opened = recordFormRef.current ? exportPatientRecord(recordFormRef.current, selected.dogName) : false; setNotice(opened ? 'Relatório aberto com os dados atuais para impressão ou salvamento em PDF.' : 'O navegador bloqueou a janela do relatório.') }}>⇩ Exportar PDF</button><button className="primary-button" onClick={() => setScreen('create')}>+ Adicionar registro</button></div></div>
    {notice && <p className="record-notice" role="status">{notice}</p>}
    <form className="animal-record-form" ref={recordFormRef}>
      <header className="animal-record-title"><div className="record-logo">✚</div><div><h3>Ficha de Prontuário Animal</h3><p>Registro Clínico Veterinário · IFES Campus Santa Teresa</p></div><label>Nº do prontuário<input defaultValue={String(selected.id).padStart(4, '0')} /></label></header>
      <div className="animal-record-grid">
        <RecordSection number="1" title="Identificação do animal" className="half"><div className="paper-fields"><label>Nome<input defaultValue={selected.dogName} /></label><label>Espécie<input defaultValue="Canino" /></label><label>Raça<input defaultValue={selected.breed} /></label><label>Sexo<input defaultValue={selected.sex} /></label><label>Idade<input defaultValue={selected.age} /></label><label>Peso<input defaultValue={`${latestWeight ?? ''} kg`} /></label><label>Microchip<input /></label><label>Nº de cadastro<input defaultValue={String(selected.id).padStart(4, '0')} /></label></div></RecordSection>
        <RecordSection number="2" title="Dados do tutor" className="half"><div className="paper-fields"><label>Nome<input defaultValue={selected.tutorName} /></label><label>CPF<input defaultValue={selected.tutorCpf} /></label><label>Telefone<input defaultValue={selected.tutorPhone} /></label><label>E-mail<input defaultValue={selected.tutorEmail} /></label><label className="wide">Endereço<input defaultValue={selected.tutorAddress} /></label><label className="wide">Cidade/UF<input defaultValue={selected.tutorCity} /></label></div></RecordSection>
        <RecordSection number="3" title="Histórico clínico" className="half"><div className="paper-fields single"><label>Queixa principal<input defaultValue={displayRecord.description} /></label><label>Histórico da doença<textarea defaultValue={displayRecord.description} /></label><label>Doenças anteriores<input defaultValue={selected.previousDiseases.join(', ')} /></label><label>Alergias<input defaultValue={selected.allergies.join(', ') || 'Nenhuma conhecida'} /></label><label>Medicamentos em uso<input defaultValue={displayRecord.prescriptions.join('; ')} /></label><label>Observações<textarea /></label></div></RecordSection>
        <RecordSection number="4" title="Vacinação e prevenção" className="half" onAddRow={() => setVaccinationRows((count) => count + 1)} onRemoveRow={vaccinationRows > 1 ? () => setVaccinationRows((count) => Math.max(1, count - 1)) : undefined}><table><thead><tr><th>Vacina/procedimento</th><th>Data</th><th>Dose</th><th>Próxima dose</th></tr></thead><tbody>{selected.vaccines.map((vaccine, index) => { const [name, dateValue = ''] = vaccine.split(' - '); return <tr key={`${vaccine}-${index}`}><EditableCells values={[name, dateValue, '', '']} /></tr> })}{Array.from({ length: vaccinationRows }, (_, index) => <tr key={`vacina-extra-${index}`}><EditableCells count={4} /></tr>)}</tbody></table><div className="paper-fields single compact"><label>Controle de pulgas<input /></label><label>Controle de carrapatos<input /></label><label>Observações<input /></label></div></RecordSection>
        <RecordSection number="5" title="Exame físico" className="full"><div className="physical-exam-grid"><div className="paper-fields single"><label>Temperatura<input /> °C</label><label>Frequência cardíaca<input /> bpm</label><label>Frequência respiratória<input /> mpm</label><label>Mucosas<input /></label><label>TPC<input /> seg</label><label>Hidratação<input /></label></div><div className="paper-fields single"><label>Pele e pelagem<input /></label><label>Olhos<input /></label><label>Ouvidos<input /></label><label>Boca/dentes<input /></label><label>Sistema respiratório<input /></label><label>Sistema cardiovascular<input /></label></div><div className="paper-fields single"><label>Sistema gastrointestinal<input /></label><label>Sistema urinário<input /></label><label>Sistema reprodutivo<input /></label><label>Sistema neurológico<input /></label><label>Dor<input /></label><label>Observações<input /></label></div></div></RecordSection>
        <RecordSection number="6" title="Exames solicitados" className="third"><div className="check-list">{['Hemograma','Bioquímico','Urina','Fezes','Radiografia','Ultrassonografia'].map((exam) => <label key={exam}><input type="checkbox" defaultChecked={displayRecord.exams.some((item) => item.includes(exam))} />{exam}</label>)}</div><label className="paper-textarea">Resultados<textarea /></label></RecordSection>
        <RecordSection number="7" title="Diagnóstico" className="third"><div className="paper-fields single"><label>Suspeita clínica<textarea /></label><label>Diagnóstico definitivo<textarea defaultValue={displayRecord.diagnosis} /></label><label>Diagnósticos diferenciais<textarea /></label></div></RecordSection>
        <RecordSection number="8" title="Tratamento" className="third" onAddRow={() => setTreatmentRows((count) => count + 1)} onRemoveRow={treatmentRows > 1 ? () => setTreatmentRows((count) => Math.max(1, count - 1)) : undefined}><table><thead><tr><th>Medicamento</th><th>Dose</th><th>Frequência</th></tr></thead><tbody>{displayRecord.prescriptions.map((item, index) => <tr key={`${item}-${index}`}><EditableCells values={[item, '', '']} /></tr>)}{Array.from({ length: treatmentRows }, (_, index) => <tr key={`tratamento-extra-${index}`}><EditableCells count={3} /></tr>)}</tbody></table><div className="paper-fields single compact"><label>Procedimentos<input defaultValue={displayRecord.conduct} /></label><label>Orientações ao tutor<input /></label></div></RecordSection>
        <RecordSection number="9" title="Evolução clínica" className="two-thirds" onAddRow={() => setEvolutionRows((count) => count + 1)} onRemoveRow={evolutionRows > 0 ? () => setEvolutionRows((count) => Math.max(0, count - 1)) : undefined}><table><thead><tr><th>Data</th><th>Evolução/observações</th><th>Procedimentos</th><th>Responsável</th></tr></thead><tbody>{[...selected.records].sort((a,b) => b.date.localeCompare(a.date)).map((record) => <tr key={record.id}><EditableCells values={[formatDate(record.date), record.description, record.kind, record.veterinarian]} /></tr>)}{Array.from({ length: evolutionRows }, (_, index) => <tr key={`evolucao-extra-${index}`}><EditableCells count={4} /></tr>)}</tbody></table></RecordSection>
        <RecordSection number="10" title="Retorno" className="third"><div className="paper-fields single"><label>Data recomendada<input type="date" /></label><label>Motivo<input /></label><label>Exames para o retorno<input /></label><label>Observações<textarea /></label></div></RecordSection>
        <RecordSection number="11" title="Alta" className="half"><div className="paper-fields single"><label>Data<input type="date" /></label><label>Condição na alta<input /></label><label>Orientações<textarea /></label><label>Prognóstico<input /></label></div></RecordSection>
        <RecordSection number="12" title="Responsável pelo atendimento" className="half"><div className="paper-fields single"><label>Médico(a)-veterinário(a)<input defaultValue={displayRecord.veterinarian} /></label><label>CRMV<input defaultValue={displayRecord.crmv} /></label><label>Alunos participantes<input defaultValue={displayRecord.students.join(', ')} /></label><label>Assinatura/validação<input defaultValue={displayRecord.validatedBy} /></label><label>Data<input defaultValue={displayRecord.date ? formatDate(displayRecord.date) : ''} /></label></div></RecordSection>
      </div><footer className="animal-record-footer">DiagnoVetis · Cuidar também é registrar</footer>
    </form>
  </section>
}

function EditableCells({ values, count }: { values?: string[]; count?: number }) {
  const cells = values ?? Array.from({ length: count ?? 0 }, () => '')
  return <>{cells.map((value, index) => <td key={index}><input aria-label={`Campo ${index + 1}`} defaultValue={value} /></td>)}</>
}

function RecordSection({ number, title, className, children, onAddRow, onRemoveRow }: { number: string; title: string; className: string; children: ReactNode; onAddRow?: () => void; onRemoveRow?: () => void }) {
  const [collapsed, setCollapsed] = useState(false)
  return <fieldset className={`paper-section ${className}${collapsed ? ' collapsed' : ''}`}><legend><span><b>{number}.</b> {title}</span><span className="paper-section-actions">{onRemoveRow && !collapsed && <button type="button" className="remove-table-row" aria-label={`Remover última linha adicionada em ${title}`} title="Remover última linha adicionada" onClick={onRemoveRow}>×</button>}{onAddRow && !collapsed && <button type="button" className="add-table-row" aria-label={`Adicionar linha em ${title}`} title="Adicionar linha" onClick={onAddRow}>＋</button>}<button type="button" className="collapse-section" aria-expanded={!collapsed} aria-label={`${collapsed ? 'Expandir' : 'Minimizar'} ${title}`} onClick={() => setCollapsed((value) => !value)}>{collapsed ? '＋' : '−'}</button></span></legend>{!collapsed && children}</fieldset>
}
