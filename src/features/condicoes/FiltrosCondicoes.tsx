import { CampoBusca } from '../../components/common/CampoBusca'
import { CampoSelecao } from '../../components/common/CampoSelecao'
import { FAIXAS_ETARIAS, CATEGORIAS, ETIOLOGIAS, SISTEMAS, type FiltrosClinicos } from './catalogoClinico'
import { SimboloCao } from './SimboloCao'

type FiltrosCondicoesProps = {
  filtros: FiltrosClinicos
  aoAlterar: (key: keyof FiltrosClinicos, valor: string) => void
}

const OPCOES_ZOONOSE = [
  { valor: 'yes', rotulo: 'Sim' },
  { valor: 'no', rotulo: 'Não' },
]

export function FiltrosCondicoes({ filtros, aoAlterar }: FiltrosCondicoesProps) {
  return (
    <div className="filter-bar content-card">
      <div className="conditions-categories">
        <div role="group" aria-label="Categorias">
          {['', ...CATEGORIAS].map((categoria) => (
            <button
              className={filtros.categoria === categoria ? 'active' : ''}
              aria-pressed={filtros.categoria === categoria}
              key={categoria || 'todas'}
              onClick={() => aoAlterar('categoria', categoria)}
            >
              {categoria || 'Todas'}
            </button>
          ))}
        </div>
        <span className="conditions-canine">
          <SimboloCao />
          Somente cães
        </span>
      </div>
      <div className="filter-fields">
        <CampoBusca
          valor={filtros.busca}
          aoAlterar={(valor) => aoAlterar('busca', valor)}
          placeholder="Doença, sinal clínico ou agente etiológico"
        />
        <CampoSelecao
          rotulo="Sistema"
          valor={filtros.sistema}
          aoAlterar={(valor) => aoAlterar('sistema', valor)}
          opcoes={SISTEMAS}
        />
        <CampoSelecao
          rotulo="Etiologia"
          valor={filtros.etiologia}
          aoAlterar={(valor) => aoAlterar('etiologia', valor)}
          opcoes={ETIOLOGIAS}
          rotuloTodos="Todas"
        />
        <CampoSelecao
          rotulo="Zoonose"
          valor={filtros.condicao}
          aoAlterar={(valor) => aoAlterar('condicao', valor)}
          opcoes={OPCOES_ZOONOSE}
          rotuloTodos="Todas"
        />
        <CampoSelecao
          rotulo="Faixa etária"
          valor={filtros.idade}
          aoAlterar={(valor) => aoAlterar('idade', valor)}
          opcoes={FAIXAS_ETARIAS}
          rotuloTodos="Todas"
        />
      </div>
    </div>
  )
}
