import type { Agendamento, LembreteAgendamento } from '../agendaTipos'
import { formatarDataAgenda } from './filtrosAgenda'

type PainelLembretesProps = {
  lembretes: { agendamento: Agendamento; lembrete: LembreteAgendamento }[]
  aoConcluir: (agendamento: Agendamento, lembreteId: number) => void
}

export function PainelLembretes({ lembretes, aoConcluir }: PainelLembretesProps) {
  return (
    <aside className="reminders-column">
      <h3>Lembretes</h3>
      <div className="reminders-panel">
        {lembretes.length === 0 && <p className="empty-reminders">Nenhum lembrete pendente.</p>}
        {lembretes.slice(0, 6).map(({ agendamento, lembrete }) => (
          <div className="reminder-item" key={lembrete.id}>
            <span className={`reminder-icon ${lembrete.tipo}`}>{lembrete.tipo === 'return' ? '↻' : '+'}</span>
            <div>
              <strong>
                {lembrete.tipo === 'return' ? 'Retorno' : 'Vacinação'} — {agendamento.nomePet}
              </strong>
              <span>
                {formatarDataAgenda(lembrete.data)} · {agendamento.nomeTutor}
              </span>
            </div>
            <button aria-label="Marcar lembrete como concluído" onClick={() => aoConcluir(agendamento, lembrete.id)}>
              ✓
            </button>
          </div>
        ))}
      </div>
    </aside>
  )
}
