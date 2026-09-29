import type { ReactNode } from 'react'
import { PERIOD_VIEWS, dateInput, periodLabel, shiftPeriod } from './period'
import type { PeriodValue } from './period'

type PeriodFilterProps = {
  value: PeriodValue
  onChange: (value: PeriodValue) => void
  label: string
  searching?: boolean
  children?: ReactNode
}

export function PeriodFilter({ value, onChange, label, searching = false, children }: PeriodFilterProps) {
  const showAll = value.view === 'all'
  return (
    <div className="agenda-toolbar content-card">
      <div className="view-switch" aria-label={label}>
        {PERIOD_VIEWS.map(({ view, label: text }) => (
          <button
            type="button"
            key={view}
            className={value.view === view ? 'active' : ''}
            aria-pressed={value.view === view}
            onClick={() => onChange({ ...value, view })}
          >
            {text}
          </button>
        ))}
      </div>
      <div className="period-navigation">
        {!showAll && (
          <button
            type="button"
            aria-label="Período anterior"
            onClick={() => onChange({ ...value, date: shiftPeriod(value.date, value.view, -1) })}
          >
            ‹
          </button>
        )}
        <strong aria-live="polite">
          {searching ? 'Busca em todo o período' : periodLabel(value.date, value.view)}
        </strong>
        {!showAll && (
          <button
            type="button"
            aria-label="Próximo período"
            onClick={() => onChange({ ...value, date: shiftPeriod(value.date, value.view, 1) })}
          >
            ›
          </button>
        )}
        <button
          type="button"
          className="today-button"
          onClick={() => onChange({ view: showAll ? 'day' : value.view, date: dateInput() })}
        >
          Hoje
        </button>
      </div>
      <div className="agenda-filters">
        {children}
        <label>
          <span>Ir para data</span>
          <input
            type="date"
            value={value.date}
            onChange={(event) => {
              if (event.target.value) onChange({ view: showAll ? 'day' : value.view, date: event.target.value })
            }}
          />
        </label>
      </div>
    </div>
  )
}
