import { Icone } from '../../../components/common/Icone'
import type { DadosAtendimento } from '../atendimentoTipos'

type EtapaDiagnosticoProps = {
  dados: DadosAtendimento
  atualizar: (key: keyof DadosAtendimento, valor: string) => void
  aoVoltar: () => void
}

const CONDICOES_ALTA = ['Curado', 'Melhora clínica', 'Estável', 'Encaminhado', 'Óbito']
const OPCOES_PROGNOSTICO = ['Excelente', 'Bom', 'Reservado', 'Grave', 'Desfavorável']

export function EtapaDiagnostico({ dados, atualizar, aoVoltar }: EtapaDiagnosticoProps) {
  return (
    <section className="consultation-panel content-card">
      <h2>4. Diagnóstico e conduta</h2>

      <div className="consultation-textareas">
        <label>
          Diagnóstico clínico
          <textarea
            value={dados.diagnostico}
            onChange={(e) => atualizar('diagnostico', e.target.value)}
            placeholder="Diagnóstico ou suspeita clínica"
          />
        </label>
        <label>
          Buscar no Banco de Zoonoses
          <div className="consultation-search">
            <Icone>
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="m16 16 5 5" />
            </Icone>
            <input
              value={dados.suspeitaZoonose}
              onChange={(e) => atualizar('suspeitaZoonose', e.target.value)}
              placeholder="Digite para buscar zoonoses..."
            />
          </div>
        </label>
        <label>
          Observações e Conduta
          <textarea
            value={dados.conduta}
            onChange={(e) => atualizar('conduta', e.target.value)}
            placeholder="Observações médicas, tratamento, orientações e conduta terapêutica."
          />
        </label>
      </div>

      <h3 className="exam-section-title">Alta</h3>
      <div className="consultation-form-grid exam-grid">
        <label>
          Data da alta
          <input type="date" value={dados.dataAlta} onChange={(e) => atualizar('dataAlta', e.target.value)} />
        </label>
        <label>
          Condição na alta
          <select value={dados.condicaoAlta} onChange={(e) => atualizar('condicaoAlta', e.target.value)}>
            <option value="">Selecione...</option>
            {CONDICOES_ALTA.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Prognóstico
          <select value={dados.prognosticoAlta} onChange={(e) => atualizar('prognosticoAlta', e.target.value)}>
            <option value="">Selecione...</option>
            {OPCOES_PROGNOSTICO.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className="full-field">
          Orientações ao tutor
          <textarea
            value={dados.orientacoesAlta}
            onChange={(e) => atualizar('orientacoesAlta', e.target.value)}
            placeholder="Cuidados em casa, retorno, restrições, medicação..."
          />
        </label>
      </div>

      <div className="step-navigation">
        <button className="secondary-button" onClick={aoVoltar}>
          ← Voltar
        </button>
      </div>
    </section>
  )
}
