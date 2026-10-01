import { useMemo, useState } from 'react'
import { useCondicoes } from './useCondicoes'
import { CatalogoCondicoes } from './CatalogoCondicoes'
import { FiltrosCondicoes } from './FiltrosCondicoes'
import { FormularioCondicao } from './FormularioCondicao'
import { ResumoCondicao, type DetalheCondicao } from './ResumoCondicao'
import { FILTROS_VAZIOS, filtrarCondicoes, type FiltrosClinicos } from './catalogoClinico'
import type { Condicao } from './condicaoTipos'

function indicadoresCondicoes(itens: Condicao[]) {
  return [
    { titulo: 'Condições cadastradas', valor: itens.length, nota: 'Base clínica ativa', cor: 'green' },
    {
      titulo: 'Zoonoses caninas',
      valor: itens.filter((item) => item.dadosClinicos.ehZoonose).length,
      nota: 'Atenção biossanitária',
      cor: 'teal',
    },
    {
      titulo: 'Protocolos vinculados',
      valor: itens.reduce((total, item) => total + item.dadosClinicos.protocolos.length, 0),
      nota: 'Condutas associadas',
      cor: 'amber',
    },
    {
      titulo: 'Alertas clínicos',
      valor: itens.filter((item) => item.dadosClinicos.alerta.trim()).length,
      nota: 'Observações para revisão',
      cor: 'red',
    },
  ]
}

function textoSituacao(carregando: boolean, erro: string) {
  if (carregando) return 'Atualizando…'
  return erro ? 'Falha na atualização' : 'Sistema conectado'
}

export function ModuloCondicoes() {
  const { zoonoses: itens, carregando, erro, atualizadoEm, recarregar, criarCondicao } = useCondicoes()
  const [filtros, setFiltros] = useState<FiltrosClinicos>(FILTROS_VAZIOS)
  const [idSelecionado, setIdSelecionado] = useState<number | null>(null)
  const [tela, setTela] = useState<'consulta' | 'cadastro'>('consulta')
  const [detalhe, setDetalhe] = useState<DetalheCondicao>('resumo')
  const filtrados = useMemo(() => filtrarCondicoes(itens, filtros), [itens, filtros])
  const selecionado = filtrados.find((item) => item.id === idSelecionado) ?? filtrados[0] ?? null

  function atualizar(key: keyof FiltrosClinicos, valor: string) {
    setFiltros((atual) => ({ ...atual, [key]: valor }))
    setDetalhe('resumo')
  }

  return (
    <section className="conditions-module">
      <header className="conditions-heading">
        <div>
          <span className="conditions-eyebrow">BASE CLÍNICA CANINA</span>
          <h2>Condições clínicas</h2>
          <p>Consulte doenças, síndromes, zoonoses e protocolos voltados à clínica de cães.</p>
        </div>
        <div className="conditions-sync">
          <div className={`conditions-status${erro ? ' offline' : ''}`} role="status">
            <strong>
              <i />
              {textoSituacao(carregando, erro)}
            </strong>
            <small>
              {atualizadoEm
                ? `Atualizado às ${atualizadoEm.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                : 'Aguardando dados'}
            </small>
          </div>
          <button className="outline-button" disabled={carregando} onClick={() => void recarregar()}>
            Atualizar dados
          </button>
        </div>
      </header>
      {erro && (
        <p className="conditions-error" role="alert">
          {erro}
          {atualizadoEm && ' Os últimos dados carregados foram mantidos.'}
        </p>
      )}
      {tela === 'cadastro' ? (
        <FormularioCondicao aoSalvar={criarCondicao} aoCancelar={() => setTela('consulta')} />
      ) : (
        <>
          <FiltrosCondicoes filtros={filtros} aoAlterar={atualizar} />
          <div className="conditions-stats">
            {indicadoresCondicoes(itens).map((indicador) => (
              <article className={`content-card ${indicador.cor}`} key={indicador.titulo}>
                <h3>{indicador.titulo}</h3>
                <strong>{!atualizadoEm ? '—' : indicador.valor}</strong>
                <p>{indicador.nota}</p>
              </article>
            ))}
          </div>
          <div className="conditions-browser">
            <CatalogoCondicoes
              condicoes={filtrados}
              totalGeral={itens.length}
              idSelecionado={selecionado?.id ?? null}
              ordem={filtros.ordem}
              aoAlterarOrdem={(ordem) => atualizar('ordem', ordem)}
              aoSelecionar={(id) => {
                setIdSelecionado(id)
                setDetalhe('resumo')
              }}
              aoLimparFiltros={() => setFiltros(FILTROS_VAZIOS)}
              aoCriar={() => setTela('cadastro')}
              carregando={carregando}
              carregado={Boolean(atualizadoEm)}
              falhou={Boolean(erro)}
            />
            <ResumoCondicao condicao={selecionado} detalhe={detalhe} aoAlterarDetalhe={setDetalhe} />
          </div>
        </>
      )}
    </section>
  )
}
