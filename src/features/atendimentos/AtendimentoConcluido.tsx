import { gerarRelatorioAtendimento } from './relatorioAtendimento'
import type { DadosAtendimento } from './atendimentoTipos'
import type { RascunhoExame } from './exameTipos'

export type AtendimentoFinalizado = { dados: DadosAtendimento; exames: RascunhoExame[]; id: number; petId?: number }

type AtendimentoConcluidoProps = {
  concluido: AtendimentoFinalizado
  mensagem: string
  aoMensagem: (mensagem: string) => void
  aoNovo: () => void
  novoDesabilitado: boolean
  aoAbrirProntuario?: (petId: number) => void
}

export function AtendimentoConcluido({
  concluido,
  mensagem,
  aoMensagem,
  aoNovo,
  novoDesabilitado,
  aoAbrirProntuario,
}: AtendimentoConcluidoProps) {
  const { petId } = concluido
  return (
    <section className="consultation-panel content-card">
      <h2>Atendimento finalizado</h2>
      <p>
        Atendimento nº {concluido.id} de <strong>{concluido.dados.nomePet}</strong> salvo no prontuário.
      </p>
      {concluido.dados.condicaoAlta === 'Óbito' ? (
        <aside className="profile-notice profile-notice--death">
          <span>✝</span>
          <p>
            <strong>Condição na alta: óbito.</strong> Registre o óbito completo no prontuário do animal: data e hora,
            circunstâncias, causa provável, eutanásia, necropsia e destinação do corpo.
            {aoAbrirProntuario && petId !== undefined && (
              <>
                {' '}
                <button type="button" className="text-back-button" onClick={() => aoAbrirProntuario(petId)}>
                  Abrir prontuário para registrar o óbito →
                </button>
              </>
            )}
          </p>
        </aside>
      ) : (
        <p>Para emitir uma receita, acesse a aba Receituário.</p>
      )}
      <div className="form-actions">
        <button
          className="secondary-button"
          onClick={() =>
            aoMensagem(
              gerarRelatorioAtendimento(concluido.dados, concluido.exames)
                ? 'Relatório clínico aberto.'
                : 'O navegador bloqueou o relatório. Permita novas janelas e tente novamente.',
            )
          }
        >
          Gerar relatório clínico
        </button>
        <button className="secondary-button" disabled={novoDesabilitado} onClick={aoNovo}>
          Novo atendimento
        </button>
      </div>
      {mensagem && (
        <p className="consultation-message" role="status">
          {mensagem}
        </p>
      )}
    </section>
  )
}
