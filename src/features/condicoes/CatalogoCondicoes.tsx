import type { Condicao } from './condicaoTipos'
import { mostrarValor } from './catalogoClinico'
import { SimboloCao } from './SimboloCao'

type CatalogoCondicoesProps = {
  condicoes: Condicao[]
  totalGeral: number
  idSelecionado: number | null
  ordem: string
  aoAlterarOrdem: (ordem: string) => void
  aoSelecionar: (id: number) => void
  aoLimparFiltros: () => void
  aoCriar: () => void
  carregando: boolean
  carregado: boolean
  falhou: boolean
}

function LinhaCondicao({
  item,
  selecionado,
  aoSelecionar,
}: {
  item: Condicao
  selecionado: boolean
  aoSelecionar: () => void
}) {
  return (
    <button
      className={`condition-row${selecionado ? ' selected' : ''}`}
      aria-pressed={selecionado}
      onClick={aoSelecionar}
    >
      <span className="condition-avatar">
        <SimboloCao />
      </span>
      <span className="condition-row-copy">
        <span className="condition-row-title">
          <strong>{item.nome}</strong>
          {item.dadosClinicos.ehZoonose && <span className="condition-badge warning">! &nbsp; Zoonose</span>}
        </span>
        <span>
          {mostrarValor(item.dadosClinicos.categoria)} · {mostrarValor(item.dadosClinicos.etiologia)}
        </span>
        <span>Sistema: {mostrarValor(item.dadosClinicos.sistemas)}</span>
        <span>Sinais principais: {mostrarValor(item.sintomas)}</span>
      </span>
      <span className="condition-view">Ver detalhes</span>
      <span className="condition-chevron">›</span>
    </button>
  )
}

function textoVazio(falhou: boolean, carregado: boolean, totalGeral: number) {
  if (falhou && !carregado) return 'Catálogo indisponível no momento.'
  return totalGeral ? 'Nenhuma condição corresponde aos filtros.' : 'Nenhuma condição cadastrada.'
}

export function CatalogoCondicoes({
  condicoes,
  totalGeral,
  idSelecionado,
  ordem,
  aoAlterarOrdem,
  aoSelecionar,
  aoLimparFiltros,
  aoCriar,
  carregando,
  carregado,
  falhou,
}: CatalogoCondicoesProps) {
  function renderizarLista() {
    if (carregando && !carregado) return <p className="conditions-empty">Carregando catálogo…</p>
    if (condicoes.length)
      return condicoes.map((item) => (
        <LinhaCondicao
          key={item.id}
          item={item}
          selecionado={idSelecionado === item.id}
          aoSelecionar={() => aoSelecionar(item.id)}
        />
      ))
    return (
      <div className="conditions-empty">
        <p>{textoVazio(falhou, carregado, totalGeral)}</p>
        {totalGeral > 0 && (
          <button className="outline-button" onClick={aoLimparFiltros}>
            Limpar filtros
          </button>
        )}
      </div>
    )
  }

  return (
    <section className="conditions-catalog content-card">
      <header>
        <h3>Catálogo de condições</h3>
        <label>
          Ordenar por:
          <select value={ordem} onChange={(evento) => aoAlterarOrdem(evento.target.value)}>
            <option value="az">Nome (A–Z)</option>
            <option value="za">Nome (Z–A)</option>
            <option value="risk">Maior risco</option>
          </select>
        </label>
      </header>
      <div className="conditions-list" aria-busy={carregando}>
        {renderizarLista()}
      </div>
      <footer>
        <span>{condicoes.length} condição(ões) encontrada(s)</span>
        <button className="conditions-add" onClick={aoCriar}>
          ＋ Cadastrar condição
        </button>
      </footer>
    </section>
  )
}
