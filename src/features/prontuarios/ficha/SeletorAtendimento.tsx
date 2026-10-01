import type { RegistroClinico } from '../prontuarioTipos'
import { formatarDataAtendimento } from './formatarDataAtendimento'

type SeletorAtendimentoProps = {
  atendimentos: RegistroClinico[]
  atual: RegistroClinico | undefined
  aoSelecionar: (atendimentoId: number) => void
  mostrarVersoes: boolean
  aoAlternarVersoes: () => void
  aoRetificar: (atendimentoId: number) => void
}

const foiRetificado = (atendimento: RegistroClinico) => (atendimento.versao ?? 1) > 1

function NotaRetificacao({ atendimento }: { atendimento: RegistroClinico }) {
  return (
    <small className="record-selector-retified">
      Retificado{atendimento.retificadoPorNome ? ` por ${atendimento.retificadoPorNome}` : ''}
      {atendimento.retificadoEm ? ` em ${atendimento.retificadoEm.toLocaleDateString('pt-BR')}` : ''} · versão{' '}
      {atendimento.versao}
    </small>
  )
}

export function SeletorAtendimento({
  atendimentos,
  atual,
  aoSelecionar,
  mostrarVersoes,
  aoAlternarVersoes,
  aoRetificar,
}: SeletorAtendimentoProps) {
  if (atendimentos.length === 0)
    return (
      <section className="content-card record-selector">
        <p className="record-selector-empty">Nenhum atendimento registrado para este paciente.</p>
      </section>
    )

  return (
    <section className="content-card record-selector">
      <label className="record-selector-field">
        Atendimento exibido no prontuário
        <select value={atual?.id ?? ''} onChange={(evento) => aoSelecionar(Number(evento.target.value))}>
          {atendimentos.map((atendimento) => (
            <option key={atendimento.id} value={atendimento.id}>
              Nº {atendimento.id} · {formatarDataAtendimento(atendimento.data)} · {atendimento.veterinario}
              {foiRetificado(atendimento) ? ' · retificado' : ''}
            </option>
          ))}
        </select>
        {atual && foiRetificado(atual) && <NotaRetificacao atendimento={atual} />}
      </label>
      {atual && (
        <div className="record-selector-actions">
          <button className="outline-button" type="button" onClick={aoAlternarVersoes}>
            {mostrarVersoes ? 'Ocultar histórico' : 'Histórico de retificações'}
          </button>
          <button className="primary-button" type="button" onClick={() => aoRetificar(atual.id)}>
            Editar/Retificar atendimento
          </button>
        </div>
      )}
    </section>
  )
}
