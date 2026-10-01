import { useState } from 'react'
import { SupervisaoService } from '../../../services/SupervisaoService'
import { LIBERACAO } from '../tiposLiberacao'
import type { Liberacao, ObitoParaAprovar, ReceitaParaAprovar, TipoLiberacao } from '../supervisaoTipos'
import { SeletorParticipantes } from '../../shared/SeletorParticipantes'
import { AguardandoAprovacao } from './AguardandoAprovacao'
import { useAprovacaoRemota } from './useAprovacaoRemota'
import { useOpcoesSupervisao } from './useOpcoesSupervisao'

const supervisaoService = new SupervisaoService()

type TelaLiberacaoProps = {
  aoLiberar: (liberacao: Liberacao) => void
  consultaId?: number
  receita?: ReceitaParaAprovar
  obito?: ObitoParaAprovar
  aoCancelar?: () => void
  aoRecusar?: (mensagem: string) => void
}

function tipoDoPedido({ consultaId, receita, obito }: Pick<TelaLiberacaoProps, 'consultaId' | 'receita' | 'obito'>) {
  if (obito) return 'obito'
  if (receita) return 'receita'
  if (consultaId !== undefined) return 'retificacao'
  return 'atendimento'
}

export function TelaLiberacao({ aoLiberar, consultaId, receita, obito, aoCancelar, aoRecusar }: TelaLiberacaoProps) {
  const alvo = { consultaId, receita, obito }
  const tipo: TipoLiberacao = tipoDoPedido(alvo)
  const textos = LIBERACAO[tipo]
  const [supervisorId, setSupervisorId] = useState('')
  const [participantes, setParticipantes] = useState<string[]>([])
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const { veterinarios, estudantes, carregando } = useOpcoesSupervisao(setMensagem)
  const remoto = useAprovacaoRemota(tipo, { aoLiberar, aoRecusar, aoMensagem: setMensagem })

  const supervisor = veterinarios.find((veterinario) => veterinario.idPerfil === supervisorId)
  const estudantesSelecionados = estudantes.filter((estudante) => participantes.includes(estudante.idPerfil))
  const idsParticipantes = textos.comParticipantes ? participantes : []

  function alternarParticipante(idPerfil: string) {
    setParticipantes((atual) =>
      atual.includes(idPerfil) ? atual.filter((id) => id !== idPerfil) : [...atual, idPerfil],
    )
  }

  async function liberarComSenha() {
    if (enviando) return
    if (!supervisor) {
      setMensagem('Selecione o professor responsável pela supervisão.')
      return
    }
    if (!senha) {
      setMensagem('O professor precisa digitar a senha para liberar o atendimento.')
      return
    }
    setEnviando(true)
    setMensagem('')
    try {
      const id = await supervisaoService.liberarComSenha(supervisor.idPerfil, senha, idsParticipantes, alvo)
      setSenha('')
      if (!id) {
        setMensagem('Senha incorreta. Peça ao professor para digitar novamente.')
        return
      }
      aoLiberar({ id, supervisor, participantes: estudantesSelecionados })
    } catch (erro) {
      setSenha('')
      const texto = (erro as Error).message
      setMensagem(texto.includes('tentativas') ? texto : `Não foi possível liberar ${textos.alvo}. Tente novamente.`)
    } finally {
      setEnviando(false)
    }
  }

  async function enviarPedido() {
    if (enviando) return
    if (!supervisor) {
      setMensagem('Selecione o professor responsável pela supervisão.')
      return
    }
    setEnviando(true)
    setMensagem('')
    try {
      const id = await supervisaoService.solicitar(supervisor.idPerfil, idsParticipantes, alvo)
      remoto.aguardar({ id, supervisor, participantes: estudantesSelecionados, enviadoEm: Date.now() })
    } catch {
      setMensagem('Não foi possível enviar o pedido ao professor. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  if (carregando)
    return (
      <section className="consultation-panel content-card">
        <p>Carregando professores e estudantes...</p>
      </section>
    )

  if (remoto.aguardando)
    return <AguardandoAprovacao tipo={tipo} pedido={remoto.aguardando} aoCancelar={() => void remoto.cancelar()} />

  return (
    <section className="consultation-panel content-card">
      <h2>{textos.titulo(consultaId)}</h2>
      <p>{textos.explicacao}</p>

      <div className="consultation-form-grid">
        <label>
          Professor supervisor *
          <select
            value={supervisorId}
            onChange={(evento) => {
              setSupervisorId(evento.target.value)
              setMensagem('')
            }}
            disabled={enviando}
          >
            <option value="">Selecione o professor</option>
            {veterinarios.map((veterinario) => (
              <option key={veterinario.idPerfil} value={veterinario.idPerfil}>
                {veterinario.nome} — CRMV {veterinario.crmv}
              </option>
            ))}
          </select>
        </label>
      </div>

      {textos.comParticipantes && (
        <SeletorParticipantes
          estudantes={estudantes}
          selecionado={participantes}
          aoAlternar={alternarParticipante}
          desabilitado={enviando}
        />
      )}

      <div className="supervision-options">
        <div className="supervision-option">
          <strong>Professor presente</strong>
          <div className="consultation-form-grid supervision-single-column">
            <label>
              Senha do professor supervisor
              <input
                type="password"
                name="supervisor-authorization"
                autoComplete="off"
                value={senha}
                onChange={(evento) => setSenha(evento.target.value)}
                onKeyDown={(evento) => {
                  if (evento.key === 'Enter') void liberarComSenha()
                }}
                placeholder="O professor digita a própria senha aqui"
                disabled={enviando}
              />
              <small className="supervision-field-help">
                É a mesma senha que o professor usa para entrar no DiagnoVetis. Você continua logado na sua conta.
              </small>
            </label>
          </div>
          <button className="primary-button" onClick={() => void liberarComSenha()} disabled={enviando}>
            {enviando ? 'Verificando...' : textos.botaoSenha}
          </button>
        </div>

        <div className="supervision-option">
          <strong>Professor em outro lugar</strong>
          <p className="supervision-option-text">{textos.textoPedidoRemoto}</p>
          <button className="secondary-button" onClick={() => void enviarPedido()} disabled={enviando}>
            Enviar pedido ao professor
          </button>
        </div>
      </div>

      {mensagem && (
        <p className="consultation-message" role="status">
          {mensagem}
        </p>
      )}
      {aoCancelar && (
        <div className="consultation-next">
          <button className="secondary-button" onClick={aoCancelar} disabled={enviando}>
            Voltar
          </button>
        </div>
      )}
    </section>
  )
}
