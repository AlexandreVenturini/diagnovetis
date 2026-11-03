import { useState } from 'react'
import { CampoBusca } from '../../components/common/CampoBusca'
import { CampoSelecao } from '../../components/common/CampoSelecao'
import type { ExameCategoria } from '../../models/Exame'
import {
  agruparResultados,
  buscarComMotivo,
  buscarExames,
  GRUPOS_EXAME,
  mesmoNome,
  type GrupoExame,
  type ResultadoBusca,
} from './catalogoExames'
import { exameDoModelo, modeloDoRascunho, novoExame, type RascunhoExame } from './exameTipos'

export function SeletorExames({
  selecionados,
  aoAdicionar,
}: {
  selecionados: RascunhoExame[]
  aoAdicionar: (exame: RascunhoExame) => void
}) {
  const [busca, setBusca] = useState('')
  const [grupo, setGrupo] = useState<GrupoExame | ''>('')
  const [categoria, setCategoria] = useState<ExameCategoria>('outro')
  const [mostrarOutro, setMostrarOutro] = useState(false)
  const termo = busca.trim()
  const alterarBusca = (valor: string) => {
    setBusca(valor)
    setMostrarOutro(false)
  }
  const secoes = termo
    ? agruparResultados(buscarComMotivo(termo))
    : grupo
      ? [{ grupo, itens: buscarExames('', grupo).map((modelo): ResultadoBusca => ({ modelo })) }]
      : []
  const opcoes = secoes.flatMap((secao) => secao.itens.map((item) => item.modelo))
  const jaSelecionado = (nome: string) => selecionados.some((exame) => mesmoNome(exame.nome, nome))
  const podeAdicionarOutro = termo && !opcoes.some((modelo) => mesmoNome(modelo.nome, termo))
  const grupos = (Object.keys(GRUPOS_EXAME) as GrupoExame[]).map((id) => {
    const escolhidos = selecionados.filter((exame) => modeloDoRascunho(exame)?.grupo === id).length
    return {
      valor: id,
      rotulo: escolhidos ? `${GRUPOS_EXAME[id]} (${escolhidos} no atendimento)` : GRUPOS_EXAME[id],
    }
  })

  return (
    <div className="exam-picker">
      <div className="exam-picker-filters">
        <CampoSelecao
          rotulo="Grupo de exames"
          valor={grupo}
          aoAlterar={(valor) => {
            setGrupo(valor as GrupoExame | '')
            alterarBusca('')
          }}
          opcoes={grupos}
          rotuloTodos="Selecione um grupo"
        />
        <CampoBusca
          rotulo="Ou busque pelo nome"
          valor={busca}
          aoAlterar={alterarBusca}
          placeholder="Nome, sigla ou agente (ex.: hemograma, 4Dx, cinomose, raio-x)"
        />
      </div>
      {termo ? (
        <h4 className="exam-picker-title" role="status">
          {opcoes.length
            ? `${opcoes.length} ${opcoes.length === 1 ? 'exame encontrado' : 'exames encontrados'} para “${termo}”`
            : `Nenhum exame do catálogo corresponde a “${termo}”`}
        </h4>
      ) : grupo ? (
        <h4 className="exam-picker-title">Exames de {GRUPOS_EXAME[grupo]}</h4>
      ) : (
        <p className="exam-picker-hint">Selecione um grupo para ver os exames dele, ou busque pelo nome.</p>
      )}
      {secoes.map((secao) => (
        <section key={secao.grupo} className="exam-options-group">
          {termo && <h5>{GRUPOS_EXAME[secao.grupo]}</h5>}
          <ul className="exam-options">
            {secao.itens.map(({ modelo, motivo }) => {
              const selecionado = jaSelecionado(modelo.nome)
              return (
                <li key={modelo.id}>
                  <button
                    type="button"
                    className="exam-choice"
                    disabled={selecionado}
                    onClick={() => {
                      aoAdicionar(exameDoModelo(modelo))
                      alterarBusca('')
                    }}
                  >
                    {selecionado ? '✓' : '＋'} {modelo.nome}
                    {motivo && <small>inclui {motivo}</small>}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
      {podeAdicionarOutro && opcoes.length > 0 && !mostrarOutro && (
        <button type="button" className="outline-button exam-picker-other" onClick={() => setMostrarOutro(true)}>
          Não é nenhum destes? Adicionar “{termo}” como outro exame
        </button>
      )}
      {podeAdicionarOutro && (mostrarOutro || !opcoes.length) ? (
        <div className="consultation-form-grid exam-custom">
          <label>
            Categoria de “{termo}”
            <select value={categoria} onChange={(e) => setCategoria(e.target.value as ExameCategoria)}>
              <option value="laboratorial">Laboratorial</option>
              <option value="imagem">Imagem</option>
              <option value="outro">Outro</option>
            </select>
          </label>
          <button
            type="button"
            className="secondary-button"
            disabled={jaSelecionado(termo)}
            onClick={() => {
              aoAdicionar(novoExame(termo, categoria))
              alterarBusca('')
            }}
          >
            Adicionar “{termo}” como outro exame
          </button>
        </div>
      ) : (
        !termo &&
        grupo && (
          <p className="exam-picker-hint">
            Não encontrou o exame? Digite o nome na busca para adicioná-lo como outro exame.
          </p>
        )
      )}
    </div>
  )
}
