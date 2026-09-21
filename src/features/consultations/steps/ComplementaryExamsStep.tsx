import { useState } from 'react'
import { newExam, type ExamDraft } from '../examTypes'
import { ExamFields } from '../ExamFields'

const laboratory = ['Hemograma', 'Bioquímica sérica', 'Urinálise', 'Exame de fezes', 'Citologia', 'Sorologia', 'PCR']
const imaging = ['Radiografia', 'Ultrassonografia']
export function ComplementaryExamsStep({ exams, onChange, onBack, onNext }: { exams: ExamDraft[]; onChange: (exams: ExamDraft[]) => void; onBack: () => void; onNext: () => void }) {
  const [custom, setCustom] = useState('')
  const [category, setCategory] = useState<ExamDraft['categoria']>('outro')
  return <section inert={exams.some(exam => exam.laudoCarregando)} className="consultation-panel content-card complementary-exams-step"><h2>4. Exames complementares</h2><p>Selecione os exames solicitados neste atendimento. Registre o laudo em texto ou anexe um PDF ou imagem em cada exame selecionado. Os laudos serão salvos ao finalizar o atendimento e poderão ser atualizados no prontuário.</p>
    {([{ title: 'Laboratoriais', names: laboratory, category: 'laboratorial' }, { title: 'Imagem', names: imaging, category: 'imagem' }] as const).map(group => <fieldset className="exam-catalog" key={group.title}><legend>{group.title}</legend>{group.names.map(name => <button type="button" className="exam-choice" key={name} disabled={exams.some(exam => exam.nome === name)} onClick={() => onChange([...exams, newExam(name, group.category)])}>＋ {name}</button>)}</fieldset>)}
    <div className="consultation-form-grid exam-custom"><label>Outro exame<input value={custom} onChange={e => setCustom(e.target.value)} placeholder="Nome do exame" /></label><label>Categoria<select value={category} onChange={e => setCategory(e.target.value as ExamDraft['categoria'])}><option value="laboratorial">Laboratorial</option><option value="imagem">Imagem</option><option value="outro">Outro</option></select></label><button type="button" className="secondary-button" disabled={!custom.trim()} onClick={() => { onChange([...exams, newExam(custom.trim(), category)]); setCustom('') }}>Adicionar exame</button></div>
    <h3>Exames selecionados ({exams.length})</h3>{!exams.length && <p>Nenhum exame solicitado. Você pode continuar sem adicionar exames.</p>}
    {exams.map((exam, index) => <fieldset className="exam-request" key={exam.key}><legend>{index + 1}. {exam.nome || 'Novo exame'}</legend><ExamFields value={exam} onChange={value => onChange(exams.map(current => current.key === exam.key ? value : current))} /><button type="button" className="secondary-button" onClick={() => onChange(exams.filter(current => current.key !== exam.key))}>Remover solicitação</button></fieldset>)}
    <div className="step-navigation"><button type="button" className="secondary-button" onClick={onBack}>← Exame físico</button><button type="button" className="primary-button" onClick={onNext}>Diagnóstico e conduta →</button></div>
  </section>
}
