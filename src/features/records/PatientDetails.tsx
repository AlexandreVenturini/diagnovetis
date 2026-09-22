import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { RecordExams } from './RecordExams'
import { PatientPrescriptions } from '../prescriptions/PatientPrescriptions'
import { exportPatientRecord } from './recordReport'
import { generatePrescription } from '../consultations/prescriptionReport'
import type { ClinicalRecord, PatientRecord } from './recordTypes'

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR')
}

type PatientDetailsProps = {
  selected: PatientRecord
  onBack: () => void
  onCreate: () => void
  onExamSaved: (exam: Parameters<React.ComponentProps<typeof RecordExams>['onSaved']>[0]) => void
}

export function PatientDetails({ selected, onBack, onCreate, onExamSaved }: PatientDetailsProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [notice, setNotice] = useState('')
  const [vaccinationRows, setVaccinationRows] = useState(1)
  const [treatmentRows, setTreatmentRows] = useState(1)
  const [evolutionRows, setEvolutionRows] = useState(0)

  const latestWeight = selected.weights.at(-1)?.weight
  const latestRecord = [...selected.records].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)[0]
  const emptyRecord: ClinicalRecord = {
    id: 0, kind: 'Consulta', date: '', veterinarian: '', crmv: '',
    students: [], description: '', diagnosis: '', conduct: '',
    exams: [], attachments: [], prescriptions: [], validation: 'pending', validatedBy: '',
  }
  const display = latestRecord ?? emptyRecord

  function exportPdf() {
    const opened = formRef.current ? exportPatientRecord(formRef.current, selected.dogName) : false
    setNotice(opened
      ? 'Relatório aberto para impressão ou salvamento em PDF.'
      : 'O navegador bloqueou a janela do relatório.')
  }

  function reprintPrescription(record: ClinicalRecord) {
    const saved = record.savedPrescription!
    try {
      const opened = generatePrescription(saved.patient, saved.prescription, new Date(saved.issuedAt))
      setNotice(opened
        ? 'Receita original aberta para impressão ou salvamento em PDF.'
        : 'O navegador bloqueou a receita. Permita novas janelas e tente novamente.')
    } catch {
      setNotice('Não foi possível gerar esta receita. Confira os dados do atendimento.')
    }
  }

  const recordsWithPrescription = selected.records.filter((r) => r.savedPrescription)

  return (
    <section className="record-details-module">
      <div className="records-heading record-detail-heading">
        <div>
          <button className="text-back-button" onClick={onBack}>‹ Prontuários</button>
          <h2>{selected.dogName}</h2>
          <p>Tutor: {selected.tutorName} · {selected.breed} · {selected.age}</p>
        </div>
        <div className="record-header-actions">
          <button className="outline-button" onClick={exportPdf}>⇩ Exportar PDF</button>
          <button className="primary-button" onClick={onCreate}>+ Adicionar registro</button>
        </div>
      </div>

      {notice && <p className="record-notice" role="status">{notice}</p>}

      <PatientPrescriptions petId={selected.id} />

      <section className="content-card saved-prescriptions" aria-labelledby="saved-prescriptions-title">
        <h3 id="saved-prescriptions-title">Receitas dos atendimentos</h3>
        {recordsWithPrescription.length > 0 ? (
          recordsWithPrescription.map((record) => (
            <article key={record.id}>
              <div>
                <strong>Atendimento nº {record.id} · {formatDate(record.date)}</strong>
                <p>{record.savedPrescription!.patient.veterinarian}</p>
              </div>
              <button className="outline-button" type="button" onClick={() => reprintPrescription(record)}>
                Reimprimir receita
              </button>
            </article>
          ))
        ) : (
          <p>Nenhuma receita arquivada neste prontuário.</p>
        )}
      </section>

      <form className="animal-record-form" ref={formRef}>
        <header className="animal-record-title">
          <div className="record-logo">✚</div>
          <div>
            <h3>Ficha de Prontuário Animal</h3>
            <p>Registro Clínico Veterinário · IFES Campus Santa Teresa</p>
          </div>
          <label>Nº do prontuário<input defaultValue={String(selected.id).padStart(4, '0')} /></label>
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
              <label>Medicamentos em uso<input defaultValue={display.prescriptions.join('; ')} /></label>
              <label>Observações<textarea /></label>
            </div>
          </Section>

          <Section
            number="4"
            title="Vacinação e prevenção"
            className="half"
            onAddRow={() => setVaccinationRows((n) => n + 1)}
            onRemoveRow={vaccinationRows > 1 ? () => setVaccinationRows((n) => Math.max(1, n - 1)) : undefined}
          >
            <table>
              <thead><tr><th>Vacina/procedimento</th><th>Data</th><th>Dose</th><th>Próxima dose</th></tr></thead>
              <tbody>
                {selected.vaccines.map((vaccine, i) => {
                  const [name, dateVal = ''] = vaccine.split(' - ')
                  return <tr key={`${vaccine}-${i}`}><EditableCells values={[name, dateVal, '', '']} /></tr>
                })}
                {Array.from({ length: vaccinationRows }, (_, i) => (
                  <tr key={`vacina-extra-${i}`}><EditableCells count={4} /></tr>
                ))}
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

          <Section number="6" title="Exames Complementares" className="full">
            <RecordExams key={selected.id} records={selected.records} onSaved={onExamSaved} />
          </Section>

          <Section number="7" title="Diagnóstico" className="third">
            <div className="paper-fields single">
              <label>Suspeita clínica<textarea /></label>
              <label>Diagnóstico definitivo<textarea defaultValue={display.diagnosis} /></label>
              <label>Diagnósticos diferenciais<textarea /></label>
            </div>
          </Section>

          <Section
            number="8"
            title="Tratamento"
            className="third"
            onAddRow={() => setTreatmentRows((n) => n + 1)}
            onRemoveRow={treatmentRows > 1 ? () => setTreatmentRows((n) => Math.max(1, n - 1)) : undefined}
          >
            <table>
              <thead><tr><th>Medicamento</th><th>Dose</th><th>Frequência</th></tr></thead>
              <tbody>
                {display.prescriptions.map((item, i) => (
                  <tr key={`${item}-${i}`}><EditableCells values={[item, '', '']} /></tr>
                ))}
                {Array.from({ length: treatmentRows }, (_, i) => (
                  <tr key={`tratamento-extra-${i}`}><EditableCells count={3} /></tr>
                ))}
              </tbody>
            </table>
            <div className="paper-fields single compact">
              <label>Procedimentos<input defaultValue={display.conduct} /></label>
              <label>Orientações ao tutor<input /></label>
            </div>
          </Section>

          <Section
            number="9"
            title="Evolução clínica"
            className="two-thirds"
            onAddRow={() => setEvolutionRows((n) => n + 1)}
            onRemoveRow={evolutionRows > 0 ? () => setEvolutionRows((n) => Math.max(0, n - 1)) : undefined}
          >
            <table>
              <thead><tr><th>Data</th><th>Evolução/observações</th><th>Procedimentos</th><th>Responsável</th></tr></thead>
              <tbody>
                {[...selected.records]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((record) => (
                    <tr key={record.id}>
                      <EditableCells values={[formatDate(record.date), record.description, record.kind, record.veterinarian]} />
                    </tr>
                  ))}
                {Array.from({ length: evolutionRows }, (_, i) => (
                  <tr key={`evolucao-extra-${i}`}><EditableCells count={4} /></tr>
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

function EditableCells({ values, count }: { values?: string[]; count?: number }) {
  const cells = values ?? Array.from({ length: count ?? 0 }, () => '')
  return (
    <>
      {cells.map((value, i) => (
        <td key={i}><input aria-label={`Campo ${i + 1}`} defaultValue={value} /></td>
      ))}
    </>
  )
}

function Section({
  number, title, className, children, onAddRow, onRemoveRow,
}: {
  number: string
  title: string
  className: string
  children: ReactNode
  onAddRow?: () => void
  onRemoveRow?: () => void
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <fieldset className={`paper-section ${className}${collapsed ? ' collapsed' : ''}`}>
      <legend>
        <span><b>{number}.</b> {title}</span>
        <span className="paper-section-actions">
          {onRemoveRow && !collapsed && (
            <button type="button" className="remove-table-row" aria-label={`Remover última linha em ${title}`} onClick={onRemoveRow}>×</button>
          )}
          {onAddRow && !collapsed && (
            <button type="button" className="add-table-row" aria-label={`Adicionar linha em ${title}`} onClick={onAddRow}>＋</button>
          )}
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
