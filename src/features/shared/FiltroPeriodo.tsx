import type { ReactNode } from 'react'
import { VISOES_PERIODO, dataParaCampo, rotuloPeriodo, deslocarPeriodo } from './periodo'
import type { Periodo } from './periodo'

type FiltroPeriodoProps = {
  valor: Periodo
  aoAlterar: (valor: Periodo) => void
  rotulo: string
  buscando?: boolean
  children?: ReactNode
}

export function FiltroPeriodo({ valor, aoAlterar, rotulo, buscando = false, children }: FiltroPeriodoProps) {
  const mostrarTodos = valor.visao === 'tudo'
  return (
    <div className="agenda-toolbar content-card">
      <div className="view-switch" aria-label={rotulo}>
        {VISOES_PERIODO.map(({ visao, rotulo: texto }) => (
          <button
            type="button"
            key={visao}
            className={valor.visao === visao ? 'active' : ''}
            aria-pressed={valor.visao === visao}
            onClick={() => aoAlterar({ ...valor, visao })}
          >
            {texto}
          </button>
        ))}
      </div>
      <div className="period-navigation">
        {!mostrarTodos && (
          <button
            type="button"
            aria-label="Período anterior"
            onClick={() => aoAlterar({ ...valor, data: deslocarPeriodo(valor.data, valor.visao, -1) })}
          >
            ‹
          </button>
        )}
        <strong aria-live="polite">
          {buscando ? 'Busca em todo o período' : rotuloPeriodo(valor.data, valor.visao)}
        </strong>
        {!mostrarTodos && (
          <button
            type="button"
            aria-label="Próximo período"
            onClick={() => aoAlterar({ ...valor, data: deslocarPeriodo(valor.data, valor.visao, 1) })}
          >
            ›
          </button>
        )}
        <button
          type="button"
          className="today-button"
          onClick={() => aoAlterar({ visao: mostrarTodos ? 'dia' : valor.visao, data: dataParaCampo() })}
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
            value={valor.data}
            onChange={(evento) => {
              if (evento.target.value)
                aoAlterar({ visao: mostrarTodos ? 'dia' : valor.visao, data: evento.target.value })
            }}
          />
        </label>
      </div>
    </div>
  )
}
