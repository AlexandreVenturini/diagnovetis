import { Icon } from '../../../components/common/Icon'
import type { ConsultationData } from '../consultationTypes'

type DiagnosisStepProps = {
  data: ConsultationData
  update: (key: keyof ConsultationData, value: string) => void
  onBack: () => void
}

const DISCHARGE_CONDITIONS = ['Curado', 'Melhora clínica', 'Estável', 'Encaminhado', 'Óbito']
const PROGNOSIS_OPTIONS = ['Excelente', 'Bom', 'Reservado', 'Grave', 'Desfavorável']

export function DiagnosisStep({ data, update, onBack }: DiagnosisStepProps) {
  return (
    <section className="consultation-panel content-card">
      <h2>4. Diagnóstico e conduta</h2>

      <div className="consultation-textareas">
        <label>
          Diagnóstico clínico
          <textarea value={data.diagnosis} onChange={(e) => update('diagnosis', e.target.value)} placeholder="Diagnóstico ou suspeita clínica" />
        </label>
        <label>
          Buscar no Banco de Zoonoses
          <div className="consultation-search">
            <Icon><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></Icon>
            <input value={data.zoonosisSearch} onChange={(e) => update('zoonosisSearch', e.target.value)} placeholder="Digite para buscar zoonoses..." />
          </div>
        </label>
        <label>
          Observações e Conduta
          <textarea value={data.conduct} onChange={(e) => update('conduct', e.target.value)} placeholder="Observações médicas, tratamento, orientações e conduta terapêutica." />
        </label>
      </div>

      <h3 className="exam-section-title">Alta</h3>
      <div className="consultation-form-grid exam-grid">
        <label>
          Data da alta
          <input type="date" value={data.dischargeDate} onChange={(e) => update('dischargeDate', e.target.value)} />
        </label>
        <label>
          Condição na alta
          <select value={data.dischargeCondition} onChange={(e) => update('dischargeCondition', e.target.value)}>
            <option value="">Selecione...</option>
            {DISCHARGE_CONDITIONS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label>
          Prognóstico
          <select value={data.dischargePrognosis} onChange={(e) => update('dischargePrognosis', e.target.value)}>
            <option value="">Selecione...</option>
            {PROGNOSIS_OPTIONS.map((p) => <option key={p}>{p}</option>)}
          </select>
        </label>
        <label className="full-field">
          Orientações ao tutor
          <textarea value={data.dischargeInstructions} onChange={(e) => update('dischargeInstructions', e.target.value)} placeholder="Cuidados em casa, retorno, restrições, medicação..." />
        </label>
      </div>

      <div className="step-navigation">
        <button className="secondary-button" onClick={onBack}>← Voltar</button>
      </div>
    </section>
  )
}
