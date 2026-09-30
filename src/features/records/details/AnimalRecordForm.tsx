import type { Ref } from 'react'
import { RecordExams } from './RecordExams'
import { PaperFields, PaperSection, PaperTable } from './PaperSection'
import type { PaperField } from './PaperSection'
import { formatRecordDate } from './formatRecordDate'
import type { ClinicalRecord, ExameFisicoRecord, PatientRecord } from '../recordTypes'
import type { Exame } from '../../../models/Exame'

type PhysicalExamItem = [label: string, key: keyof ExameFisicoRecord, unit?: string]

const PHYSICAL_EXAM_COLUMNS: PhysicalExamItem[][] = [
  [
    ['Temperatura', 'temperatura', '°C'],
    ['Frequência cardíaca', 'frequenciaCardiaca', 'bpm'],
    ['Frequência respiratória', 'frequenciaRespiratoria', 'mpm'],
    ['Mucosas', 'mucosas'],
    ['TPC', 'tpc', 'seg'],
    ['Hidratação', 'hidratacao'],
  ],
  [
    ['Pele e pelagem', 'pelePelagem'],
    ['Olhos', 'olhos'],
    ['Ouvidos', 'ouvidos'],
    ['Boca/dentes', 'bocaDentes'],
    ['Sistema respiratório', 'sistemaRespiratorio'],
    ['Sistema cardiovascular', 'sistemaCardiovascular'],
  ],
  [
    ['Sistema gastrointestinal', 'sistemaGastrointestinal'],
    ['Sistema urinário', 'sistemaUrinario'],
    ['Sistema reprodutivo', 'sistemaReprodutivo'],
    ['Sistema neurológico', 'sistemaNeurologico'],
    ['Dor', 'dor'],
    ['Nível de consciência', 'nivelConsciencia'],
  ],
]

type AnimalRecordFormProps = {
  ref: Ref<HTMLFormElement>
  patient: PatientRecord
  record: ClinicalRecord
  canEditExams: boolean
  onExamSaved: (exam: Exame) => void
}

export function AnimalRecordForm({ ref, patient, record, canEditExams, onExamSaved }: AnimalRecordFormProps) {
  const registrationNumber = String(patient.id).padStart(4, '0')
  const latestWeight = patient.weights.at(-1)?.weight
  const physicalExam = (items: PhysicalExamItem[]): PaperField[] =>
    items.map(([label, key, unit]) => ({ label, value: record.exameFisico?.[key] ?? '', unit }))
  const vaccineRows = patient.vaccines.length
    ? patient.vaccines.map((vaccine, index) => {
        const [name, date = ''] = vaccine.split(' - ')
        return { key: `${vaccine}-${index}`, values: [name, date, '', ''] }
      })
    : [{ key: 'vazio', values: ['Nenhum registro', '', '', ''] }]
  const evolutionRows = [...patient.records]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((item) => ({
      key: item.id,
      values: [formatRecordDate(item.date), item.description, 'Consulta', item.veterinarian],
    }))

  return (
    <form className="animal-record-form" ref={ref}>
      <header className="animal-record-title">
        <div className="record-logo">✚</div>
        <div>
          <h3>Ficha de Prontuário Animal</h3>
          <p>Registro Clínico Veterinário · IFES Campus Santa Teresa</p>
        </div>
        <label>
          Nº do prontuário
          <input readOnly defaultValue={registrationNumber} />
        </label>
      </header>

      <div className="animal-record-grid">
        <PaperSection number="1" title="Identificação do animal" className="half">
          <PaperFields
            fields={[
              { label: 'Nome', value: patient.dogName },
              { label: 'Espécie', value: 'Canino' },
              { label: 'Raça', value: patient.breed },
              { label: 'Sexo', value: patient.sex },
              { label: 'Idade', value: patient.age },
              { label: 'Peso', value: latestWeight ? `${latestWeight} kg` : '' },
              { label: 'Microchip' },
              { label: 'Nº de cadastro', value: registrationNumber },
            ]}
          />
        </PaperSection>

        <PaperSection number="2" title="Dados do tutor" className="half">
          <PaperFields
            fields={[
              { label: 'Nome', value: patient.tutorName },
              { label: 'CPF', value: patient.tutorCpf },
              { label: 'Telefone', value: patient.tutorPhone },
              { label: 'E-mail', value: patient.tutorEmail },
              { label: 'Endereço', value: patient.tutorAddress, wide: true },
              { label: 'Cidade/UF', value: patient.tutorCity, wide: true },
            ]}
          />
        </PaperSection>

        <PaperSection number="3" title="Histórico clínico" className="half">
          <PaperFields
            variant="single"
            fields={[
              { label: 'Queixa principal', value: record.description },
              { label: 'Histórico da doença', value: record.description, multiline: true },
              { label: 'Doenças anteriores', value: patient.previousDiseases.join(', ') },
              { label: 'Alergias', value: patient.allergies.join(', ') || 'Nenhuma conhecida' },
              { label: 'Observações', multiline: true },
            ]}
          />
        </PaperSection>

        <PaperSection number="4" title="Vacinação e prevenção" className="half">
          <PaperTable headers={['Vacina/procedimento', 'Data', 'Dose', 'Próxima dose']} rows={vaccineRows} />
          <PaperFields
            variant="single compact"
            fields={[{ label: 'Controle de pulgas' }, { label: 'Controle de carrapatos' }, { label: 'Observações' }]}
          />
        </PaperSection>

        <PaperSection number="5" title="Exame físico" className="full">
          <div className="physical-exam-grid">
            {PHYSICAL_EXAM_COLUMNS.map((column) => (
              <PaperFields key={column[0][0]} variant="single" fields={physicalExam(column)} />
            ))}
          </div>
        </PaperSection>

        <PaperSection number="6" title="Exames Complementares" className="full" editable>
          <RecordExams key={patient.id} records={patient.records} onSaved={onExamSaved} canEdit={canEditExams} />
        </PaperSection>

        <PaperSection number="7" title="Diagnóstico" className="third">
          <PaperFields
            variant="single"
            fields={[
              { label: 'Suspeita clínica', multiline: true },
              { label: 'Diagnóstico definitivo', value: record.diagnosis, multiline: true },
              { label: 'Diagnósticos diferenciais', multiline: true },
            ]}
          />
        </PaperSection>

        <PaperSection number="8" title="Tratamento" className="third">
          <PaperTable
            headers={['Medicamento', 'Dose', 'Frequência']}
            rows={[{ key: 'receitas', values: ['Consulte as receitas do animal no início do prontuário', '', ''] }]}
          />
          <PaperFields
            variant="single compact"
            fields={[{ label: 'Procedimentos', value: record.conduct }, { label: 'Orientações ao tutor' }]}
          />
        </PaperSection>

        <PaperSection number="9" title="Evolução clínica" className="two-thirds">
          <PaperTable headers={['Data', 'Evolução/observações', 'Procedimentos', 'Responsável']} rows={evolutionRows} />
        </PaperSection>

        <PaperSection number="10" title="Retorno" className="third">
          <PaperFields
            variant="single"
            fields={[
              { label: 'Data recomendada', type: 'date' },
              { label: 'Motivo' },
              { label: 'Exames para o retorno' },
              { label: 'Observações', multiline: true },
            ]}
          />
        </PaperSection>

        <PaperSection number="11" title="Alta" className="half">
          <PaperFields
            variant="single"
            fields={[
              { label: 'Data', value: record.alta?.data ?? '', type: 'date' },
              { label: 'Condição na alta', value: record.alta?.condicao ?? '' },
              { label: 'Orientações', value: record.alta?.orientacoes ?? '', multiline: true },
              { label: 'Prognóstico', value: record.alta?.prognostico ?? '' },
            ]}
          />
        </PaperSection>

        <PaperSection number="12" title="Responsável pelo atendimento" className="half">
          <PaperFields
            variant="single"
            fields={[
              { label: 'Médico(a)-veterinário(a)', value: record.veterinarian },
              { label: 'CRMV', value: record.crmv },
              { label: 'Alunos participantes', value: record.students.join(', ') },
              { label: 'Assinatura/validação', value: record.validatedBy },
              { label: 'Data', value: record.date ? formatRecordDate(record.date) : '' },
            ]}
          />
        </PaperSection>
      </div>

      <footer className="animal-record-footer">DiagnoVetis · Cuidar também é registrar</footer>
    </form>
  )
}
