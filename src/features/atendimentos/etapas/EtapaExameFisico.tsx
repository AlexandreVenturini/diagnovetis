import type { DadosAtendimento } from '../atendimentoTipos'

type EtapaExameFisicoProps = {
  dados: DadosAtendimento
  atualizar: (key: keyof DadosAtendimento, valor: string) => void
  aoVoltar: () => void
  aoAvancar: () => void
}

const OPCOES_MUCOSA = ['Normal (Róseas)', 'Pálidas', 'Ictéricas', 'Cianóticas']

export function EtapaExameFisico({ dados, atualizar, aoVoltar, aoAvancar }: EtapaExameFisicoProps) {
  return (
    <section className="consultation-panel content-card">
      <h2>3. Exame Físico</h2>

      <fieldset className="mucosa-options">
        <legend>Mucosas</legend>
        <div>
          {OPCOES_MUCOSA.map((opcao) => (
            <button
              key={opcao}
              type="button"
              className={dados.mucosas === opcao ? 'selected' : ''}
              onClick={() => atualizar('mucosas', opcao)}
            >
              {opcao}
            </button>
          ))}
        </div>
      </fieldset>

      <h3 className="exam-section-title">Parâmetros vitais</h3>
      <div className="consultation-form-grid exam-grid">
        <label>
          TPC — segundos
          <input value={dados.tpc} onChange={(e) => atualizar('tpc', e.target.value)} placeholder="Normal: &lt; 2s" />
        </label>
        <label>
          Frequência Cardíaca (bpm)
          <input
            type="number"
            value={dados.frequenciaCardiaca}
            onChange={(e) => atualizar('frequenciaCardiaca', e.target.value)}
            placeholder="Normal: 60–140 bpm"
          />
        </label>
        <label>
          Frequência Respiratória (mpm)
          <input
            type="number"
            value={dados.frequenciaRespiratoria}
            onChange={(e) => atualizar('frequenciaRespiratoria', e.target.value)}
            placeholder="Normal: 10–30 mpm"
          />
        </label>
        <label>
          Temperatura (°C)
          <input
            type="number"
            step="0.1"
            value={dados.temperatura}
            onChange={(e) => atualizar('temperatura', e.target.value)}
            placeholder="Normal: 37.5–39.2°C"
          />
        </label>
        <label>
          Hidratação
          <select value={dados.hidratacao} onChange={(e) => atualizar('hidratacao', e.target.value)}>
            <option>Normal</option>
            <option>Desidratação leve</option>
            <option>Desidratação moderada</option>
            <option>Desidratação grave</option>
          </select>
        </label>
        <label>
          Nível de Consciência
          <select value={dados.nivelConsciencia} onChange={(e) => atualizar('nivelConsciencia', e.target.value)}>
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
          <input
            value={dados.pelePelagem}
            onChange={(e) => atualizar('pelePelagem', e.target.value)}
            placeholder="Ex.: Normal, ectoparasitas, lesões..."
          />
        </label>
        <label>
          Olhos
          <input
            value={dados.olhos}
            onChange={(e) => atualizar('olhos', e.target.value)}
            placeholder="Ex.: Sem alterações, secreção..."
          />
        </label>
        <label>
          Ouvidos
          <input
            value={dados.ouvidos}
            onChange={(e) => atualizar('ouvidos', e.target.value)}
            placeholder="Ex.: Sem alterações, otite..."
          />
        </label>
        <label>
          Boca e dentes
          <input
            value={dados.bocaDentes}
            onChange={(e) => atualizar('bocaDentes', e.target.value)}
            placeholder="Ex.: Tártaro, gengivite..."
          />
        </label>
        <label>
          Sistema respiratório
          <input
            value={dados.sistemaRespiratorio}
            onChange={(e) => atualizar('sistemaRespiratorio', e.target.value)}
            placeholder="Ex.: Sem alterações, dispneia..."
          />
        </label>
        <label>
          Sistema cardiovascular
          <input
            value={dados.sistemaCardiovascular}
            onChange={(e) => atualizar('sistemaCardiovascular', e.target.value)}
            placeholder="Ex.: Ritmo regular, sopro..."
          />
        </label>
        <label>
          Sistema gastrointestinal
          <input
            value={dados.sistemaGastrointestinal}
            onChange={(e) => atualizar('sistemaGastrointestinal', e.target.value)}
            placeholder="Ex.: Abdômen sem dor, diarreia..."
          />
        </label>
        <label>
          Sistema urinário
          <input
            value={dados.sistemaUrinario}
            onChange={(e) => atualizar('sistemaUrinario', e.target.value)}
            placeholder="Ex.: Sem alterações, disúria..."
          />
        </label>
        <label>
          Sistema reprodutivo
          <input
            value={dados.sistemaReprodutivo}
            onChange={(e) => atualizar('sistemaReprodutivo', e.target.value)}
            placeholder="Ex.: Sem alterações, castrado..."
          />
        </label>
        <label>
          Sistema neurológico
          <input
            value={dados.sistemaNeurologico}
            onChange={(e) => atualizar('sistemaNeurologico', e.target.value)}
            placeholder="Ex.: Reflexos preservados..."
          />
        </label>
        <label>
          Dor
          <input
            value={dados.dor}
            onChange={(e) => atualizar('dor', e.target.value)}
            placeholder="Ex.: Ausente, leve, moderada, intensa..."
          />
        </label>
      </div>

      <div className="step-navigation">
        <button className="secondary-button" onClick={aoVoltar}>
          ← Voltar
        </button>
        <button className="primary-button" onClick={aoAvancar}>
          Próximo: Diagnóstico →
        </button>
      </div>
    </section>
  )
}
