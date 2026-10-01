import { useEffect, useRef, useState } from 'react'
import { ConsultaService } from '../../../services/ConsultaService'
import type { Papel } from '../../acesso/perfil'
import { TelaLiberacao } from '../../supervisao/liberacao/TelaLiberacao'
import { SupervisaoService } from '../../../services/SupervisaoService'
import type { Liberacao } from '../../supervisao/supervisaoTipos'
import type { DadosAtendimento } from '../../atendimentos/atendimentoTipos'
import { EtapaHistoricoClinico } from '../../atendimentos/etapas/EtapaHistoricoClinico'
import { EtapaExameFisico } from '../../atendimentos/etapas/EtapaExameFisico'
import { EtapaDiagnostico } from '../../atendimentos/etapas/EtapaDiagnostico'
import { RetificacaoService } from '../../../services/RetificacaoService'
import { consultaParaDados } from '../../atendimentos/consultaParaDados'
import { dadosParaCampos } from './retificacaoRegras'

const consultaService = new ConsultaService()

const supervisaoService = new SupervisaoService()
const retificacaoService = new RetificacaoService()

type EditorRetificacaoProps = {
  consultaId: number
  papel: Papel
  aoConcluir: (mensagem: string) => void
  aoCancelar: () => void
}

const ETAPAS = ['Histórico clínico', 'Exame físico', 'Diagnóstico, conduta e alta'] as const

export function EditorRetificacao({ consultaId, papel, aoConcluir, aoCancelar }: EditorRetificacaoProps) {
  const ehEstudante = papel === 'attendant'
  const [dados, setDados] = useState<DadosAtendimento | null>(null)
  const [etapa, setEtapa] = useState(0)
  const [motivo, setMotivo] = useState('')
  const [liberacao, setLiberacao] = useState<Liberacao | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [erroCarregamento, setErroCarregamento] = useState('')
  const travaSalvar = useRef(false)

  useEffect(() => {
    let ativo = true
    consultaService
      .buscarPorId(consultaId)
      .then((consulta) => {
        if (!ativo) return
        if (!consulta) {
          setErroCarregamento('Atendimento não encontrado.')
          return
        }
        setDados(consultaParaDados(consulta))
      })
      .catch(() => {
        if (ativo) setErroCarregamento('Não foi possível carregar o atendimento.')
      })
    return () => {
      ativo = false
    }
  }, [consultaId])

  function atualizar(key: keyof DadosAtendimento, valor: string) {
    setDados((atual) => (atual ? { ...atual, [key]: valor } : atual))
    setMensagem('')
  }

  async function cancelar() {
    if (liberacao) await supervisaoService.cancelar(liberacao.id).catch(() => {})
    aoCancelar()
  }

  async function salvar() {
    if (!dados || travaSalvar.current) return
    if (!motivo.trim()) {
      setMensagem('Informe o motivo da retificação.')
      return
    }
    travaSalvar.current = true
    setSalvando(true)
    setMensagem('')
    try {
      const versao = await retificacaoService.retificar(
        consultaId,
        dadosParaCampos(dados),
        motivo.trim(),
        liberacao?.id ?? null,
      )
      aoConcluir(`Atendimento nº ${consultaId} retificado. A versão anterior foi arquivada (versão atual: ${versao}).`)
    } catch (erro) {
      setMensagem((erro as Error).message)
    } finally {
      travaSalvar.current = false
      setSalvando(false)
    }
  }

  if (erroCarregamento) {
    return (
      <section className="consultation-panel content-card">
        <p>{erroCarregamento}</p>
        <button className="secondary-button" onClick={aoCancelar}>
          Voltar
        </button>
      </section>
    )
  }
  if (!dados)
    return (
      <section className="consultation-panel content-card">
        <p>Carregando atendimento...</p>
      </section>
    )
  if (ehEstudante && !liberacao)
    return <TelaLiberacao consultaId={consultaId} aoLiberar={setLiberacao} aoCancelar={aoCancelar} />

  return (
    <section className="clinical-care-module">
      <header className="consultation-header content-card">
        <h2>Retificar atendimento nº {consultaId}</h2>
        <p>
          {dados.nomePet} · Tutor: {dados.nomeTutor} · Veterinário: {dados.veterinario}
        </p>
        <p className="retification-hint">
          A versão atual será arquivada e continuará visível no prontuário. Exames complementares são atualizados pelo
          próprio prontuário.
        </p>
        {liberacao && (
          <p>
            <strong>Retificação liberada por {liberacao.supervisor.nome}</strong>
          </p>
        )}
        <nav className="consultation-steps" aria-label="Etapas da retificação">
          {ETAPAS.map((rotulo, indice) => (
            <button key={rotulo} className={etapa === indice ? 'active' : ''} onClick={() => setEtapa(indice)}>
              {indice + 1}. {rotulo}
            </button>
          ))}
        </nav>
      </header>

      <fieldset className="consultation-edit-fields" disabled={salvando}>
        {etapa === 0 && (
          <EtapaHistoricoClinico
            dados={dados}
            atualizar={atualizar}
            aoVoltar={() => void cancelar()}
            aoAvancar={() => setEtapa(1)}
          />
        )}
        {etapa === 1 && (
          <EtapaExameFisico
            dados={dados}
            atualizar={atualizar}
            aoVoltar={() => setEtapa(0)}
            aoAvancar={() => setEtapa(2)}
          />
        )}
        {etapa === 2 && <EtapaDiagnostico dados={dados} atualizar={atualizar} aoVoltar={() => setEtapa(1)} />}
      </fieldset>

      <section className="consultation-panel content-card">
        <div className="consultation-textareas">
          <label>
            Motivo da retificação *
            <textarea
              value={motivo}
              onChange={(evento) => {
                setMotivo(evento.target.value)
                setMensagem('')
              }}
              placeholder="Ex.: correção da temperatura registrada; inclusão do resultado do exame no diagnóstico"
              disabled={salvando}
            />
          </label>
        </div>
        {mensagem && (
          <p className="consultation-message" role="status">
            {mensagem}
          </p>
        )}
        <div className="step-navigation">
          <button className="secondary-button" onClick={() => void cancelar()} disabled={salvando}>
            Cancelar
          </button>
          <button className="primary-button" onClick={() => void salvar()} disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar retificação'}
          </button>
        </div>
      </section>
    </section>
  )
}
