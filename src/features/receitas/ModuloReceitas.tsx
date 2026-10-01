import { useState } from 'react'
import type { ReceitaEmitida } from '../../services/ReceitaService'
import type { Papel } from '../acesso/perfil'
import { gerarReceita, validarReceita } from './receita'
import type { PetResumo } from '../pets/petTipos'
import { TelaLiberacao } from '../supervisao/liberacao/TelaLiberacao'
import type { Liberacao } from '../supervisao/supervisaoTipos'
import { DetalhesReceita } from './historico/DetalhesReceita'
import { HistoricoReceitas } from './historico/HistoricoReceitas'
import { FiltrosHistoricoReceitas } from './historico/FiltrosHistoricoReceitas'
import { useHistoricoReceitas } from './historico/useHistoricoReceitas'
import { FormularioNovaReceita } from './nova/FormularioNovaReceita'
import { RevisaoReceita } from './nova/RevisaoReceita'
import { useRascunhoReceita } from './nova/useRascunhoReceita'
import { useEmissaoReceita } from './nova/useEmissaoReceita'
import { useCatalogoReceita } from './useCatalogoReceita'

type ModuloReceitasProps = {
  pets: PetResumo[]
  aoAbrirProntuario: (id: number) => void
  papel?: Papel
}

function mensagemImpressao(linha: ReceitaEmitida) {
  try {
    const { paciente, receita, emitidaEm } = linha.snapshot
    return gerarReceita(paciente, receita, new Date(emitidaEm))
      ? 'Receita aberta. Use Imprimir / Salvar PDF.'
      : 'Permita novas janelas no navegador para imprimir.'
  } catch {
    return 'Não foi possível abrir esta receita. Confira os dados salvos.'
  }
}

export function ModuloReceitas({ pets, aoAbrirProntuario, papel = 'veterinarian' }: ModuloReceitasProps) {
  const ehEstudante = papel === 'attendant'
  const [aba, setAba] = useState<'historico' | 'nova'>('historico')
  const [selecionado, setSelecionado] = useState<ReceitaEmitida | null>(null)
  const [visualizacao, setVisualizacao] = useState(false)
  const [aprovando, setAprovando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const catalogo = useCatalogoReceita()
  const historico = useHistoricoReceitas()
  const rascunho = useRascunhoReceita(pets, catalogo.medicos, ehEstudante)
  const emissao = useEmissaoReceita()
  const { pet, veterinario, paciente } = rascunho

  const carregando = catalogo.carregando || historico.carregando
  const erro = catalogo.erro || historico.erro

  function iniciarNova() {
    rascunho.reiniciar()
    emissao.limpar()
    setVisualizacao(false)
    setAprovando(false)
    setMensagem('')
    setSelecionado(null)
    setAba('nova')
  }

  function aposEmissao(linha: ReceitaEmitida, texto: string) {
    historico.mostrarEmitida(linha)
    rascunho.reiniciar()
    emissao.limpar()
    setSelecionado(linha)
    setAba('historico')
    setVisualizacao(false)
    setAprovando(false)
    setMensagem(texto)
  }

  function revisar() {
    const validation = validarReceita(paciente, rascunho.receitaVisualizada)
    if (validation || !rascunho.temPesoValido) {
      setMensagem(validation || 'Informe um peso válido em kg.')
      return
    }
    setMensagem('')
    setVisualizacao(true)
  }

  async function emitir() {
    if (!pet || !veterinario) return
    setMensagem('')
    try {
      const linha = await emissao.emitir(() => [
        crypto.randomUUID(),
        pet.id,
        veterinario.id,
        {
          versao: 1,
          emitidaEm: new Date().toISOString(),
          paciente: { ...paciente },
          receita: structuredClone(rascunho.receita),
        },
      ])
      if (linha) aposEmissao(linha, 'Receita emitida e salva no prontuário do animal.')
    } catch (motivo) {
      setMensagem((motivo as Error).message)
    }
  }

  async function tratarAprovacao(liberacao: Liberacao) {
    setMensagem('')
    try {
      const linha = await emissao.emitirAprovada(liberacao.id)
      aposEmissao(linha, `Receita aprovada por ${liberacao.supervisor.nome} e salva no prontuário do animal.`)
    } catch (motivo) {
      setAprovando(false)
      setMensagem((motivo as Error).message)
    }
  }

  function renderizarHistorico() {
    if (selecionado)
      return (
        <DetalhesReceita
          linha={selecionado}
          aoVoltar={() => setSelecionado(null)}
          aoImprimir={() => setMensagem(mensagemImpressao(selecionado))}
          aoAbrirProntuario={() => aoAbrirProntuario(selecionado.petId)}
          aoNovo={iniciarNova}
        />
      )
    return (
      <HistoricoReceitas
        linhas={historico.filtrados}
        visao={historico.filtros.visao}
        buscando={historico.buscando}
        aoSelecionar={(linha) => {
          setSelecionado(linha)
          setMensagem('')
        }}
      />
    )
  }

  function renderizarNova() {
    if (aprovando && pet)
      return (
        <TelaLiberacao
          receita={{
            petId: pet.id,
            dados: {
              versao: 1,
              emitidaEm: new Date().toISOString(),
              paciente: { ...paciente },
              receita: structuredClone(rascunho.receitaVisualizada),
            },
          }}
          aoLiberar={(liberacao) => void tratarAprovacao(liberacao)}
          aoCancelar={() => setAprovando(false)}
          aoRecusar={(mensagem) => {
            setAprovando(false)
            setVisualizacao(false)
            setMensagem(`Receita recusada — ${mensagem} Corrija e envie novamente.`)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      )
    if (visualizacao)
      return (
        <RevisaoReceita
          paciente={paciente}
          receita={rascunho.receitaVisualizada}
          ehEstudante={ehEstudante}
          salvando={emissao.salvando}
          emissaoPendente={emissao.emissaoPendente}
          aoEditar={() => setVisualizacao(false)}
          aoConfirmar={() => {
            if (ehEstudante) {
              setMensagem('')
              setAprovando(true)
            } else void emitir()
          }}
        />
      )
    return (
      <FormularioNovaReceita
        pets={pets}
        medicos={catalogo.medicos}
        medicamentos={catalogo.medicamentos}
        rascunho={rascunho}
        ehEstudante={ehEstudante}
        aoRevisar={revisar}
      />
    )
  }

  function renderizarConteudo() {
    if (carregando) return <p role="status">Carregando receituário…</p>
    if (erro)
      return (
        <div role="alert">
          <p>{erro}</p>
          <button
            className="secondary-button"
            onClick={() => {
              catalogo.tentarNovamente()
              historico.reiniciar()
            }}
          >
            Tentar novamente
          </button>
        </div>
      )
    if (aba === 'historico') return renderizarHistorico()
    return (
      <>
        <p className="rx-flow">Identificação → Medicamentos e dose → Orientações → Visualização → Emissão</p>
        {renderizarNova()}
      </>
    )
  }

  return (
    <section className="receituario-module">
      <div className="records-heading">
        <div>
          <h2>Receituário</h2>
          <p>
            {ehEstudante
              ? 'Monte receitas para aprovação de um veterinário e acompanhe o histórico de cada animal.'
              : 'Emita receitas e acompanhe o histórico de cada animal.'}
          </p>
        </div>
      </div>
      <div className="form-actions" role="group" aria-label="Receituário">
        <button
          className={aba === 'historico' ? 'primary-button' : 'secondary-button'}
          disabled={emissao.salvando}
          onClick={() => {
            setAba('historico')
            setMensagem('')
          }}
        >
          Histórico
        </button>
        <button
          className={aba === 'nova' ? 'primary-button' : 'secondary-button'}
          disabled={emissao.salvando}
          onClick={() => {
            if (selecionado) iniciarNova()
            else setAba('nova')
          }}
        >
          Nova receita
        </button>
      </div>
      {mensagem && (
        <p role="status" className="consultation-message">
          {mensagem}
        </p>
      )}
      {aba === 'historico' && !erro && (
        <FiltrosHistoricoReceitas
          historico={historico.historico}
          valor={historico.filtros}
          aoAlterar={(valor) => {
            historico.setFiltros(valor)
            setSelecionado(null)
          }}
        />
      )}
      {renderizarConteudo()}
    </section>
  )
}
