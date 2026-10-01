import type { AtendimentoEmAndamento } from '../../services/ConsultaService'

type AtendimentosEmAndamentoProps = {
  itens: AtendimentoEmAndamento[]
  erro: string
  idAberto: number | null
  ocupado: boolean
  aoContinuar: (id: number) => void
  aoDescartar: (item: AtendimentoEmAndamento) => void
}

const formatarAlteracao = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

export function AtendimentosEmAndamento({
  itens,
  erro,
  idAberto,
  ocupado,
  aoContinuar,
  aoDescartar,
}: AtendimentosEmAndamentoProps) {
  if (!itens.length && !erro) return null
  return (
    <section className="content-card drafts-panel">
      <h2>Atendimentos em andamento</h2>
      <p>Atendimentos salvos para continuar depois. Eles só vão para o prontuário quando forem finalizados.</p>
      {erro && <p className="consultation-message">{erro}</p>}
      <ul className="drafts-list">
        {itens.map((item) => (
          <li key={item.id} className={`draft-item${item.id === idAberto ? ' active' : ''}`}>
            <div className="draft-info">
              <strong>
                Nº {item.id} · {item.nomePet}
              </strong>
              <span>
                Responsável: {item.nomeTutor || 'não informado'} · Veterinário: {item.veterinario || 'não informado'}
              </span>
              <small>
                Iniciado por {item.iniciadoPor || 'não informado'} · Última alteração{' '}
                {formatarAlteracao(item.atualizadoEm)}
              </small>
            </div>
            <div className="draft-actions">
              {item.id === idAberto ? (
                <span className="pill pill--info">Aberto agora</span>
              ) : (
                <button
                  type="button"
                  className="primary-button"
                  disabled={ocupado}
                  onClick={() => aoContinuar(item.id)}
                >
                  Continuar
                </button>
              )}
              {item.podeDescartar && (
                <button type="button" className="draft-discard" disabled={ocupado} onClick={() => aoDescartar(item)}>
                  Descartar
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
