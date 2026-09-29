import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { RecordExams } from './RecordExams'
import { RecordVersions } from './RecordVersions'
import { DeathSection } from './DeathSection'
import { PatientPrescriptions } from '../prescriptions/PatientPrescriptions'
import { exportPatientRecord } from './recordReport'
import type { ClinicalRecord, PatientRecord } from './recordTypes'

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR')
}

type PatientDetailsProps = {
  selected: PatientRecord
  onBack: () => void
  onExamSaved: (exam: Parameters<React.ComponentProps<typeof RecordExams>['onSaved']>[0]) => void
  onRetify: (recordId: number) => void
  onRegisterDeath: () => void
  onRetifyDeath: () => void
  canEditExams: boolean
  canRetifyDeath: boolean
  initialRecordId?: number
  initialNotice?: string
}

export function PatientDetails({ selected, onBack, onExamSaved, onRetify, onRegisterDeath, onRetifyDeath, canEditExams, canRetifyDeath, initialRecordId, initialNotice = '' }: PatientDetailsProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [notice, setNotice] = useState(initialNotice)
  const [showVersions, setShowVersions] = useState(false)

  const latestWeight = selected.weights.at(-1)?.weight
  const sortedRecords = [...selected.records].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
  const [recordId, setRecordId] = useState<number | undefined>(initialRecordId ?? sortedRecords[0]?.id)
  const latestRecord = sortedRecords.find((record) => record.id === recordId) ?? sortedRecords[0]
  const emptyRecord: ClinicalRecord = {
    id: 0, date: '', veterinarian: '', crmv: '',
    students: [], description: '', diagnosis: '', conduct: '',
    validatedBy: '',
  }
  const display = latestRecord ?? emptyRecord

  function exportPdf() {
    const opened = formRef.current ? exportPatientRecord(formRef.current, selected.dogName) : false
    setNotice(opened
      ? 'Relatório aberto para impressão ou salvamento em PDF.'
      : 'O navegador bloqueou a janela do relatório.')
  }


  return (
    <section className="record-details-module">
      <div className="records-heading record-detail-heading">
        <div>
          <button className="text-back-button" onClick={onBack}>‹ Prontuários</button>
          <h2>{selected.dogName}{selected.death && <span style={{ marginLeft: '0.6rem', fontSize: '0.8rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px', background: '#1f2937', color: '#fff', verticalAlign: 'middle' }}>Óbito em {new Date(selected.death.dataHora).toLocaleDateString('pt-BR')}</span>}</h2>
          <p>Tutor: {selected.tutorName} · {selected.breed} · {selected.age}</p>
        </div>
        <div className="record-header-actions">
          <button className="outline-button" onClick={exportPdf}>⇩ Exportar PDF</button>
          {!selected.death && <button className="secondary-button" onClick={onRegisterDeath}>Registrar óbito</button>}
        </div>
      </div>

      {notice && <p className="record-notice" role="status">{notice}</p>}

      <section className="content-card" style={{ padding: '1rem 1.25rem', marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        {sortedRecords.length === 0 ? (
          <p style={{ margin: 0 }}>Nenhum atendimento registrado para este paciente.</p>
        ) : (
          <>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontWeight: 600, fontSize: '0.85rem', minWidth: 'min(100%, 320px)' }}>
              Atendimento exibido no prontuário
              <select
                value={latestRecord?.id ?? ''}
                onChange={(event) => { setRecordId(Number(event.target.value)); setShowVersions(false) }}
                style={{ height: '40px', padding: '0 12px', border: '1px solid #d1d1d1', borderRadius: '9px', fontSize: '14px', fontWeight: 400 }}
              >
                {sortedRecords.map((record) => (
                  <option key={record.id} value={record.id}>
                    Nº {record.id} · {formatDate(record.date)} · {record.veterinarian}{(record.versao ?? 1) > 1 ? ' · retificado' : ''}
                  </option>
                ))}
              </select>
              {latestRecord && (latestRecord.versao ?? 1) > 1 && (
                <small style={{ fontWeight: 400, color: '#854d0e' }}>
                  Retificado{latestRecord.retificadoPorNome ? ` por ${latestRecord.retificadoPorNome}` : ''}{latestRecord.retificadoEm ? ` em ${latestRecord.retificadoEm.toLocaleDateString('pt-BR')}` : ''} · versão {latestRecord.versao}
                </small>
              )}
            </label>
            {latestRecord && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button className="outline-button" type="button" onClick={() => setShowVersions((value) => !value)}>
                  {showVersions ? 'Ocultar histórico' : 'Histórico de retificações'}
                </button>
                <button className="primary-button" type="button" onClick={() => onRetify(latestRecord.id)}>Editar/Retificar atendimento</button>
              </div>
            )}
          </>
        )}
      </section>

      {showVersions && latestRecord && <RecordVersions consultaId={latestRecord.id} onClose={() => setShowVersions(false)} />}

      {selected.death && <DeathSection death={selected.death} canRetify={canRetifyDeath} onRetify={onRetifyDeath} />}

      <PatientPrescriptions petId={selected.id} />

      <form className="animal-record-form" ref={formRef}>
        <header className="animal-record-title">
          <div className="record-logo">✚</div>
          <div>
            <h3>Ficha de Prontuário Animal</h3>
            <p>Registro Clínico Veterinário · IFES Campus Santa Teresa</p>
          </div>
          <label>Nº do prontuário<input readOnly defaultValue={String(selected.id).padStart(4, '0')} /></label>
        </header>

        <div className="animal-record-grid">
          <Section number="1" title="Identificação do animal" className="half">
            <div className="paper-fields">
              <label>Nome<input defaultValue={selected.dogName} /></label>
              <label>Espécie<input defaultValue="Canino" /></label>
              <label>Raça<input defaultValue={selected.breed} /></label>
              <label>Sexo<input defaultValue={selected.sex} /></label>
              <label>Idade<input defaultValue={selected.age} /></label>
              <label>Peso<input defaultValue={latestWeight ? `${latestWeight} kg` : ''} /></label>
              <label>Microchip<input /></label>
              <label>Nº de cadastro<input defaultValue={String(selected.id).padStart(4, '0')} /></label>
            </div>
          </Section>

          <Section number="2" title="Dados do tutor" className="half">
            <div className="paper-fields">
              <label>Nome<input defaultValue={selected.tutorName} /></label>
              <label>CPF<input defaultValue={selected.tutorCpf} /></label>
              <label>Telefone<input defaultValue={selected.tutorPhone} /></label>
              <label>E-mail<input defaultValue={selected.tutorEmail} /></label>
              <label className="wide">Endereço<input defaultValue={selected.tutorAddress} /></label>
              <label className="wide">Cidade/UF<input defaultValue={selected.tutorCity} /></label>
            </div>
          </Section>

          <Section number="3" title="Histórico clínico" className="half">
            <div className="paper-fields single">
              <label>Queixa principal<input defaultValue={display.description} /></label>
              <label>Histórico da doença<textarea defaultValue={display.description} /></label>
              <label>Doenças anteriores<input defaultValue={selected.previousDiseases.join(', ')} /></label>
              <label>Alergias<input defaultValue={selected.allergies.join(', ') || 'Nenhuma conhecida'} /></label>
              <label>Observações<textarea /></label>
            </div>
          </Section>

          <Section number="4" title="Vacinação e prevenção" className="half">
            <table>
              <thead><tr><th>Vacina/procedimento</th><th>Data</th><th>Dose</th><th>Próxima dose</th></tr></thead>
              <tbody>
                {selected.vaccines.map((vaccine, i) => {
                  const [name, dateVal = ''] = vaccine.split(' - ')
                  return <tr key={`${vaccine}-${i}`}><ReadOnlyCells values={[name, dateVal, '', '']} /></tr>
                })}
                {selected.vaccines.length === 0 && <tr><ReadOnlyCells values={['Nenhum registro', '', '', '']} /></tr>}
              </tbody>
            </table>
            <div className="paper-fields single compact">
              <label>Controle de pulgas<input /></label>
              <label>Controle de carrapatos<input /></label>
              <label>Observações<input /></label>
            </div>
          </Section>

          <Section number="5" title="Exame físico" className="full">
            <div className="physical-exam-grid">
              <div className="paper-fields single">
                <label>Temperatura<input defaultValue={display.exameFisico?.temperatura ?? ''} /> °C</label>
                <label>Frequência cardíaca<input defaultValue={display.exameFisico?.frequenciaCardiaca ?? ''} /> bpm</label>
                <label>Frequência respiratória<input defaultValue={display.exameFisico?.frequenciaRespiratoria ?? ''} /> mpm</label>
                <label>Mucosas<input defaultValue={display.exameFisico?.mucosas ?? ''} /></label>
                <label>TPC<input defaultValue={display.exameFisico?.tpc ?? ''} /> seg</label>
                <label>Hidratação<input defaultValue={display.exameFisico?.hidratacao ?? ''} /></label>
              </div>
              <div className="paper-fields single">
                <label>Pele e pelagem<input defaultValue={display.exameFisico?.pelePelagem ?? ''} /></label>
                <label>Olhos<input defaultValue={display.exameFisico?.olhos ?? ''} /></label>
                <label>Ouvidos<input defaultValue={display.exameFisico?.ouvidos ?? ''} /></label>
                <label>Boca/dentes<input defaultValue={display.exameFisico?.bocaDentes ?? ''} /></label>
                <label>Sistema respiratório<input defaultValue={display.exameFisico?.sistemaRespiratorio ?? ''} /></label>
                <label>Sistema cardiovascular<input defaultValue={display.exameFisico?.sistemaCardiovascular ?? ''} /></label>
              </div>
              <div className="paper-fields single">
                <label>Sistema gastrointestinal<input defaultValue={display.exameFisico?.sistemaGastrointestinal ?? ''} /></label>
                <label>Sistema urinário<input defaultValue={display.exameFisico?.sistemaUrinario ?? ''} /></label>
                <label>Sistema reprodutivo<input defaultValue={display.exameFisico?.sistemaReprodutivo ?? ''} /></label>
                <label>Sistema neurológico<input defaultValue={display.exameFisico?.sistemaNeurologico ?? ''} /></label>
                <label>Dor<input defaultValue={display.exameFisico?.dor ?? ''} /></label>
                <label>Nível de consciência<input defaultValue={display.exameFisico?.nivelConsciencia ?? ''} /></label>
              </div>
            </div>
          </Section>

          <Section number="6" title="Exames Complementares" className="full" editable>
            <RecordExams key={selected.id} records={selected.records} onSaved={onExamSaved} canEdit={canEditExams} />
          </Section>

          <Section number="7" title="Diagnóstico" className="third">
            <div className="paper-fields single">
              <label>Suspeita clínica<textarea /></label>
              <label>Diagnóstico definitivo<textarea defaultValue={display.diagnosis} /></label>
              <label>Diagnósticos diferenciais<textarea /></label>
            </div>
          </Section>

          <Section number="8" title="Tratamento" className="third">
            <table>
              <thead><tr><th>Medicamento</th><th>Dose</th><th>Frequência</th></tr></thead>
              <tbody>
                <tr><ReadOnlyCells values={['Consulte as receitas do animal no início do prontuário', '', '']} /></tr>
              </tbody>
            </table>
            <div className="paper-fields single compact">
              <label>Procedimentos<input defaultValue={display.conduct} /></label>
              <label>Orientações ao tutor<input /></label>
            </div>
          </Section>

          <Section number="9" title="Evolução clínica" className="two-thirds">
            <table>
              <thead><tr><th>Data</th><th>Evolução/observações</th><th>Procedimentos</th><th>Responsável</th></tr></thead>
              <tbody>
                {[...selected.records]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((record) => (
                    <tr key={record.id}>
                      <ReadOnlyCells values={[formatDate(record.date), record.description, 'Consulta', record.veterinarian]} />
                    </tr>
                  ))}
              </tbody>
            </table>
          </Section>

          <Section number="10" title="Retorno" className="third">
            <div className="paper-fields single">
              <label>Data recomendada<input type="date" /></label>
              <label>Motivo<input /></label>
              <label>Exames para o retorno<input /></label>
              <label>Observações<textarea /></label>
            </div>
          </Section>

          <Section number="11" title="Alta" className="half">
            <div className="paper-fields single">
              <label>Data<input type="date" defaultValue={display.alta?.data ?? ''} /></label>
              <label>Condição na alta<input defaultValue={display.alta?.condicao ?? ''} /></label>
              <label>Orientações<textarea defaultValue={display.alta?.orientacoes ?? ''} /></label>
              <label>Prognóstico<input defaultValue={display.alta?.prognostico ?? ''} /></label>
            </div>
          </Section>

          <Section number="12" title="Responsável pelo atendimento" className="half">
            <div className="paper-fields single">
              <label>Médico(a)-veterinário(a)<input defaultValue={display.veterinarian} /></label>
              <label>CRMV<input defaultValue={display.crmv} /></label>
              <label>Alunos participantes<input defaultValue={display.students.join(', ')} /></label>
              <label>Assinatura/validação<input defaultValue={display.validatedBy} /></label>
              <label>Data<input defaultValue={display.date ? formatDate(display.date) : ''} /></label>
            </div>
          </Section>
        </div>

        <footer className="animal-record-footer">DiagnoVetis · Cuidar também é registrar</footer>
      </form>
    </section>
  )
}

function ReadOnlyCells({ values }: { values: string[] }) {
  const cells = values
  return (
    <>
      {cells.map((value, i) => (
        <td key={i}><input aria-label={`Campo ${i + 1}`} defaultValue={value} /></td>
      ))}
    </>
  )
}

function Section({
  number, title, className, children, editable = false,
}: {
  number: string
  title: string
  className: string
  children: ReactNode
  editable?: boolean
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <fieldset className={`paper-section ${className}${collapsed ? ' collapsed' : ''}${editable ? '' : ' paper-readonly'}`} disabled={!editable}>
      <legend>
        <span><b>{number}.</b> {title}</span>
        <span className="paper-section-actions">
          <button
            type="button"
            className="collapse-section"
            aria-expanded={!collapsed}
            aria-label={`${collapsed ? 'Expandir' : 'Minimizar'} ${title}`}
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? '＋' : '−'}
          </button>
        </span>
      </legend>
      {!collapsed && children}
    </fieldset>
  )
}
