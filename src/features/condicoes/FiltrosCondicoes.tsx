import { Icone } from '../../components/common/Icone'
import { FAIXAS_ETARIAS, CATEGORIAS, ETIOLOGIAS, SISTEMAS, type FiltrosClinicos } from './catalogoClinico'
import { SimboloCao } from './SimboloCao'

type FiltrosCondicoesProps = {
  filtros: FiltrosClinicos
  aoAlterar: (key: keyof FiltrosClinicos, valor: string) => void
}

function Filtro({
  rotulo,
  valor,
  opcoes,
  vazio,
  aoAlterar,
}: {
  rotulo: string
  valor: string
  opcoes: string[]
  vazio: string
  aoAlterar: (valor: string) => void
}) {
  return (
    <label>
      {rotulo}
      <select value={valor} onChange={(evento) => aoAlterar(evento.target.value)}>
        <option value="">{vazio}</option>
        {opcoes.map((opcao) => (
          <option key={opcao}>{opcao}</option>
        ))}
      </select>
    </label>
  )
}

export function FiltrosCondicoes({ filtros, aoAlterar }: FiltrosCondicoesProps) {
  return (
    <>
      <div className="conditions-search content-card">
        <Icone>
          <circle cx="11" cy="11" r="7" />
          <path d="m16 16 5 5" />
        </Icone>
        <input
          aria-label="Buscar condições clínicas"
          value={filtros.busca}
          onChange={(evento) => aoAlterar('busca', evento.target.value)}
          placeholder="Buscar doenças, sinal clínico, agente etiológico…"
        />
        {filtros.busca && (
          <button aria-label="Limpar busca" onClick={() => aoAlterar('busca', '')}>
            ×
          </button>
        )}
      </div>
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
      <div className="conditions-filters">
        <Filtro
          rotulo="Sistema"
          valor={filtros.sistema}
          opcoes={SISTEMAS}
          vazio="Todos os sistemas"
          aoAlterar={(valor) => aoAlterar('sistema', valor)}
        />
        <Filtro
          rotulo="Etiologia"
          valor={filtros.etiologia}
          opcoes={ETIOLOGIAS}
          vazio="Todas as etiologias"
          aoAlterar={(valor) => aoAlterar('etiologia', valor)}
        />
        <label>
          Zoonose
          <select value={filtros.condicao} onChange={(evento) => aoAlterar('condicao', evento.target.value)}>
            <option value="">Todas</option>
            <option value="yes">Sim</option>
            <option value="no">Não</option>
          </select>
        </label>
        <Filtro
          rotulo="Faixa etária"
          valor={filtros.idade}
          opcoes={FAIXAS_ETARIAS}
          vazio="Todas as idades"
          aoAlterar={(valor) => aoAlterar('idade', valor)}
        />
      </div>
    </>
  )
}
