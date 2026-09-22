import type { ConsultationData } from '../consultationTypes'

type PhysicalExamStepProps = {
  data: ConsultationData
  update: (key: keyof ConsultationData, value: string) => void
  onBack: () => void
  onNext: () => void
}

const MUCOSA_OPTIONS = ['Normal (Róseas)', 'Pálidas', 'Ictéricas', 'Cianóticas']

export function PhysicalExamStep({ data, update, onBack, onNext }: PhysicalExamStepProps) {
  return (
    <section className="consultation-panel content-card">
      <h2>3. Exame Físico</h2>

      <fieldset className="mucosa-options">
        <legend>Mucosas</legend>
        <div>
          {MUCOSA_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={data.mucosa === option ? 'selected' : ''}
              onClick={() => update('mucosa', option)}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>

      <h3 className="exam-section-title">Parâmetros vitais</h3>
      <div className="consultation-form-grid exam-grid">
        <label>
          TPC — segundos
          <input value={data.capillaryRefill} onChange={(e) => update('capillaryRefill', e.target.value)} placeholder="Normal: &lt; 2s" />
        </label>
        <label>
          Frequência Cardíaca (bpm)
          <input type="number" value={data.heartRate} onChange={(e) => update('heartRate', e.target.value)} placeholder="Normal: 60–140 bpm" />
        </label>
        <label>
          Frequência Respiratória (mpm)
          <input type="number" value={data.respiratoryRate} onChange={(e) => update('respiratoryRate', e.target.value)} placeholder="Normal: 10–30 mpm" />
        </label>
        <label>
          Temperatura (°C)
          <input type="number" step="0.1" value={data.temperature} onChange={(e) => update('temperature', e.target.value)} placeholder="Normal: 37.5–39.2°C" />
        </label>
        <label>
          Hidratação
          <select value={data.hydration} onChange={(e) => update('hydration', e.target.value)}>
            <option>Normal</option>
            <option>Desidratação leve</option>
            <option>Desidratação moderada</option>
            <option>Desidratação grave</option>
          </select>
        </label>
        <label>
          Nível de Consciência
          <select value={data.consciousness} onChange={(e) => update('consciousness', e.target.value)}>
            <option>Alerta</option>
            <option>Deprimido</option>
            <option>Estupor</option>
            <option>Coma</option>
          </select>
        </label>
      </div>

      <h3 className="exam-section-title">Avaliação por sistemas</h3>
      <div className="consultation-form-grid exam-grid">
        <label>
          Pele e pelagem
          <input value={data.skinAndCoat} onChange={(e) => update('skinAndCoat', e.target.value)} placeholder="Ex.: Normal, ectoparasitas, lesões..." />
        </label>
        <label>
          Olhos
          <input value={data.eyes} onChange={(e) => update('eyes', e.target.value)} placeholder="Ex.: Sem alterações, secreção..." />
        </label>
        <label>
          Ouvidos
          <input value={data.ears} onChange={(e) => update('ears', e.target.value)} placeholder="Ex.: Sem alterações, otite..." />
        </label>
        <label>
          Boca e dentes
          <input value={data.mouthAndTeeth} onChange={(e) => update('mouthAndTeeth', e.target.value)} placeholder="Ex.: Tártaro, gengivite..." />
        </label>
        <label>
          Sistema respiratório
          <input value={data.respiratorySystem} onChange={(e) => update('respiratorySystem', e.target.value)} placeholder="Ex.: Sem alterações, dispneia..." />
        </label>
        <label>
          Sistema cardiovascular
          <input value={data.cardiovascularSystem} onChange={(e) => update('cardiovascularSystem', e.target.value)} placeholder="Ex.: Ritmo regular, sopro..." />
        </label>
        <label>
          Sistema gastrointestinal
          <input value={data.gastrointestinalSystem} onChange={(e) => update('gastrointestinalSystem', e.target.value)} placeholder="Ex.: Abdômen sem dor, diarreia..." />
        </label>
        <label>
          Sistema urinário
          <input value={data.urinarySystem} onChange={(e) => update('urinarySystem', e.target.value)} placeholder="Ex.: Sem alterações, disúria..." />
        </label>
        <label>
          Sistema reprodutivo
          <input value={data.reproductiveSystem} onChange={(e) => update('reproductiveSystem', e.target.value)} placeholder="Ex.: Sem alterações, castrado..." />
        </label>
        <label>
          Sistema neurológico
          <input value={data.neurologicalSystem} onChange={(e) => update('neurologicalSystem', e.target.value)} placeholder="Ex.: Reflexos preservados..." />
        </label>
        <label>
          Dor
          <input value={data.pain} onChange={(e) => update('pain', e.target.value)} placeholder="Ex.: Ausente, leve, moderada, intensa..." />
        </label>
      </div>

      <div className="step-navigation">
        <button className="secondary-button" onClick={onBack}>← Voltar</button>
        <button className="primary-button" onClick={onNext}>Próximo: Diagnóstico →</button>
      </div>
    </section>
  )
}
