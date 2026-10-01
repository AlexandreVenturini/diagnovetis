import type { DadosAtendimento } from '../atendimentoTipos'

type EtapaHistoricoClinicoProps = {
  dados: DadosAtendimento
  atualizar: (key: keyof DadosAtendimento, valor: string) => void
  aoVoltar: () => void
  aoAvancar: () => void
}

export function EtapaHistoricoClinico({ dados, atualizar, aoVoltar, aoAvancar }: EtapaHistoricoClinicoProps) {
  return (
    <section className="consultation-panel content-card">
      <h2>2. Histórico Clínico</h2>
      <div className="consultation-textareas">
        <label>
          Queixa Principal *
          <textarea
            value={dados.queixaPrincipal}
            onChange={(evento) => atualizar('queixaPrincipal', evento.target.value)}
            placeholder="Descreva a queixa principal que motivou a consulta..."
          />
        </label>
        <label>
          Histórico do Animal
          <textarea
            value={dados.historico}
            onChange={(evento) => atualizar('historico', evento.target.value)}
            placeholder="Histórico de vacinação, vermifugação, alimentação, convivência com outros animais, viagens recentes, etc."
          />
        </label>
      </div>
      <div className="step-navigation">
        <button className="secondary-button" onClick={aoVoltar}>
          ← Voltar
        </button>
        <button className="primary-button" disabled={!dados.queixaPrincipal} onClick={aoAvancar}>
          Próximo: Exame Físico →
        </button>
      </div>
    </section>
  )
}
