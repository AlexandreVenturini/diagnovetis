import { useEffect, useRef, useState } from 'react'
import { useAgendamentos } from '../agenda/useAgendamentos'
import { salvarConsulta } from './salvarAtendimento'
import type { Agendamento } from '../agenda/agendaTipos'
import type { Papel } from '../acesso/perfil'
import type { PetResumo } from '../pets/petTipos'
import { TelaLiberacao } from '../supervisao/liberacao/TelaLiberacao'
import { SupervisaoService } from '../../services/SupervisaoService'
import type { Liberacao, OpcaoVeterinario } from '../supervisao/supervisaoTipos'
import { AtendimentoConcluido, type AtendimentoFinalizado } from './AtendimentoConcluido'
import { aplicarVeterinario, agendamentosAbertos, validarAtendimento } from './atendimentoRegras'
import { CabecalhoAtendimento } from './CabecalhoAtendimento'
import { atendimentoDoAgendamento } from './atendimentoDoAgendamento'
import { ATENDIMENTO_VAZIO } from './atendimentoTipos'
import type { DadosAtendimento, EtapaAtendimento } from './atendimentoTipos'
import type { RascunhoExame } from './exameTipos'
import { AvisoLiberacao } from './AvisoLiberacao'
import { EtapaHistoricoClinico } from './etapas/EtapaHistoricoClinico'
import { EtapaExamesComplementares } from './etapas/EtapaExamesComplementares'
import { EtapaDiagnostico } from './etapas/EtapaDiagnostico'
import { EtapaIdentificacao } from './etapas/EtapaIdentificacao'
import { EtapaExameFisico } from './etapas/EtapaExameFisico'

type ModuloAtendimentoProps = {
  pets: PetResumo[]
  agendamentoInicial?: Agendamento
  papel?: Papel
  emailUsuario?: string
  aoAbrirProntuario?: (petId: number) => void
}

const supervisaoService = new SupervisaoService()

const AGENDA_NAO_ATUALIZADA =
  'Atendimento salvo. Não foi possível atualizar a agenda; confira o agendamento separadamente.'

export function ModuloAtendimento({
  pets,
  agendamentoInicial,
  papel = 'veterinarian',
  emailUsuario,
  aoAbrirProntuario,
}: ModuloAtendimentoProps) {
  const ehEstudante = papel === 'attendant'
  const [etapa, setEtapa] = useState<EtapaAtendimento>(1)
  const [dados, setDados] = useState<DadosAtendimento>(() =>
    agendamentoInicial ? atendimentoDoAgendamento(agendamentoInicial, pets) : ATENDIMENTO_VAZIO,
  )
  const [exames, setExames] = useState<RascunhoExame[]>([])
  const [mensagem, setMensagem] = useState('')
  const [salvando, setSalvando] = useState(false)
  const travaSalvar = useRef(false)
  const [concluido, setConcluido] = useState<AtendimentoFinalizado | null>(null)
  const [idAgendamentoSelecionado, setIdAgendamentoSelecionado] = useState<number | null>(
    agendamentoInicial?.id ?? null,
  )
  const { agendamentos, atualizarAgendamento } = useAgendamentos()
  const [veterinarios, setVeterinarios] = useState<OpcaoVeterinario[]>([])
  const [liberacao, setLiberacao] = useState<Liberacao | null>(null)

  useEffect(() => {
    let ativo = true
    supervisaoService
      .listarVeterinarios()
      .then((listaVeterinarios) => {
        if (!ativo) return
        setVeterinarios(listaVeterinarios)
        setDados((atual) => aplicarVeterinario(atual, listaVeterinarios, null, emailUsuario))
      })
      .catch(() => {
        if (ativo) setMensagem('Não foi possível carregar a lista de veterinários.')
      })
    return () => {
      ativo = false
    }
  }, [emailUsuario])

  function tratarLiberacao(nova: Liberacao) {
    setLiberacao(nova)
    setDados((atual) => aplicarVeterinario(atual, veterinarios, nova, emailUsuario))
    setMensagem('')
  }

  async function trocarLiberacao() {
    if (!liberacao || salvando) return
    const confirmado = window.confirm(
      'Cancelar a liberação atual? Os dados preenchidos serão mantidos e será preciso uma nova liberação do professor.',
    )
    if (!confirmado) return
    try {
      await supervisaoService.cancelar(liberacao.id)
    } catch {
      setMensagem('Não foi possível cancelar a liberação anterior.')
    }
    setLiberacao(null)
  }

  function selecionarAgendamento(id: number | null) {
    setIdAgendamentoSelecionado(id)
    if (id === null) return
    const agendamento = agendamentos.find((item) => item.id === id)
    if (!agendamento) return
    setExames([])
    setDados((atual) =>
      aplicarVeterinario(atendimentoDoAgendamento(agendamento, pets, atual), veterinarios, liberacao, emailUsuario),
    )
    setMensagem('Dados do agendamento carregados com sucesso.')
  }

  function atualizar(key: keyof DadosAtendimento, valor: string) {
    if ((key === 'nomePet' || key === 'nomeTutor') && dados[key] !== valor) setExames([])
    setDados((atual) => ({ ...atual, [key]: valor }))
    setMensagem('')
  }

  async function concluirAgendamento() {
    if (idAgendamentoSelecionado === null) return
    try {
      if (!(await atualizarAgendamento(idAgendamentoSelecionado, { status: 'completed' })))
        setMensagem(AGENDA_NAO_ATUALIZADA)
    } catch {
      setMensagem(AGENDA_NAO_ATUALIZADA)
    }
  }

  async function salvarAtendimento() {
    if (travaSalvar.current || concluido) return
    if (ehEstudante && !liberacao) {
      setMensagem('O atendimento precisa da liberação do professor supervisor.')
      return
    }
    const invalido = validarAtendimento(dados, exames)
    if (invalido) {
      setMensagem(invalido.mensagem)
      setEtapa(invalido.etapa)
      return
    }
    travaSalvar.current = true
    setSalvando(true)
    setMensagem('')
    try {
      const resultado = await salvarConsulta(dados, exames, ehEstudante ? (liberacao?.id ?? null) : null)
      if (!resultado.sucesso || resultado.id === undefined) {
        setMensagem(resultado.erro ?? 'Não foi possível salvar o atendimento. Os dados preenchidos foram mantidos.')
        return
      }
      setConcluido({ dados: { ...dados }, exames: structuredClone(exames), id: resultado.id, petId: resultado.petId })
      setMensagem('Atendimento finalizado e salvo no prontuário.')
      await concluirAgendamento()
    } catch {
      setMensagem('Não foi possível finalizar o atendimento. Verifique a conexão e tente novamente.')
    } finally {
      travaSalvar.current = false
      setSalvando(false)
    }
  }

  function iniciarNova() {
    setConcluido(null)
    setExames([])
    setLiberacao(null)
    setDados(aplicarVeterinario(ATENDIMENTO_VAZIO, veterinarios, null, emailUsuario))
    setIdAgendamentoSelecionado(null)
    setEtapa(1)
    setMensagem('')
  }

  if (concluido)
    return (
      <AtendimentoConcluido
        concluido={concluido}
        mensagem={mensagem}
        aoMensagem={setMensagem}
        aoNovo={iniciarNova}
        novoDesabilitado={salvando}
        aoAbrirProntuario={aoAbrirProntuario}
      />
    )
  if (ehEstudante && !liberacao) return <TelaLiberacao aoLiberar={tratarLiberacao} />
  return (
    <section className="clinical-care-module">
      {liberacao && (
        <AvisoLiberacao liberacao={liberacao} aoAlterar={() => void trocarLiberacao()} desabilitado={salvando} />
      )}
      <fieldset className="consultation-edit-fields" disabled={salvando}>
        <CabecalhoAtendimento etapaAtual={etapa} aoAlterarEtapa={setEtapa} />
        {etapa === 1 && (
          <EtapaIdentificacao
            dados={dados}
            agendamentos={agendamentosAbertos(agendamentos)}
            idAgendamentoSelecionado={idAgendamentoSelecionado}
            aoSelecionarAgendamento={selecionarAgendamento}
            atualizar={atualizar}
            aoAvancar={() => setEtapa(2)}
            veterinarios={veterinarios}
            veterinarioBloqueado={ehEstudante}
          />
        )}
        {etapa === 2 && (
          <EtapaHistoricoClinico
            dados={dados}
            atualizar={atualizar}
            aoVoltar={() => setEtapa(1)}
            aoAvancar={() => setEtapa(3)}
          />
        )}
        {etapa === 3 && (
          <EtapaExameFisico
            dados={dados}
            atualizar={atualizar}
            aoVoltar={() => setEtapa(2)}
            aoAvancar={() => setEtapa(4)}
          />
        )}
        {etapa === 4 && (
          <EtapaExamesComplementares
            exames={exames}
            aoAlterar={setExames}
            aoVoltar={() => setEtapa(3)}
            aoAvancar={() => setEtapa(5)}
          />
        )}
        {etapa === 5 && <EtapaDiagnostico dados={dados} atualizar={atualizar} aoVoltar={() => setEtapa(4)} />}
      </fieldset>
      {mensagem && (
        <p className="consultation-message" role="status">
          {mensagem}
        </p>
      )}
      <div className="consultation-actions">
        <button className="record-button" disabled={salvando} onClick={salvarAtendimento}>
          {salvando ? 'Salvando atendimento...' : 'Finalizar atendimento e salvar no prontuário'}
        </button>
      </div>
    </section>
  )
}
