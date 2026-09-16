import { Icon } from '../../../components/common/Icon'
import type { ConsultationData } from '../consultationTypes'

type DiagnosisStepProps = {
  data: ConsultationData
  update: (key: keyof ConsultationData, value: string) => void
  onBack: () => void
}

export function DiagnosisStep({ data, update, onBack }: DiagnosisStepProps) {
  return (
    <section className="consultation-panel content-card">
      <h2>5. Diagnóstico e conduta</h2>
      <div className="consultation-textareas">
        <label>Diagnóstico clínico<textarea value={data.diagnosis ?? ''} onChange={event => update('diagnosis', event.target.value)} placeholder="Diagnóstico ou suspeita clínica" /></label>
        <label>Buscar no Banco de Zoonoses<div className="consultation-search"><Icon><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></Icon><input value={data.zoonosisSearch} onChange={(event) => update('zoonosisSearch', event.target.value)} placeholder="Digite para buscar zoonoses..." /></div></label>
        <label>Observações e Conduta<textarea value={data.conduct} onChange={(event) => update('conduct', event.target.value)} placeholder="Observações médicas, tratamento, orientações, conduta terapêutica e retorno." /></label>
      </div>
      <div className="step-navigation"><button className="secondary-button" onClick={onBack}>← Voltar</button></div>
    </section>
  )
}
