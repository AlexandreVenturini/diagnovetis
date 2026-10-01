import { useEffect, useRef, useState } from 'react'
import type { AtendimentoEmAndamento } from '../../services/ConsultaService'
import { nomesResponsaveis } from '../pets/responsavelPet'
import { SupervisaoService } from '../../services/SupervisaoService'
import type { Papel } from '../acesso/perfil'
import type { Agendamento } from '../agenda/agendaTipos'
import { useAgendamentos } from '../agenda/useAgendamentos'
import type { PetResumo } from '../pets/petTipos'
import { TelaLiberacao } from '../supervisao/liberacao/TelaLiberacao'
import type { Liberacao, OpcaoEstudante, OpcaoVeterinario } from '../supervisao/supervisaoTipos'
import { AtendimentoConcluido, type AtendimentoFinalizado } from './AtendimentoConcluido'
import { atendimentoDoAgendamento } from './atendimentoDoAgendamento'
import { aplicarVeterinario, agendamentosAbertos, validarAtendimento } from './atendimentoRegras'
import { ATENDIMENTO_VAZIO } from './atendimentoTipos'
import type { DadosAtendimento, EtapaAtendimento } from './atendimentoTipos'
import { AtendimentosEmAndamento } from './AtendimentosEmAndamento'
import { AvisoLiberacao } from './AvisoLiberacao'
import { AvisoRascunho } from './AvisoRascunho'
import { CabecalhoAtendimento } from './CabecalhoAtendimento'
import type { RascunhoExame } from './exameTipos'
import { EtapaDiagnostico } from './etapas/EtapaDiagnostico'
import { EtapaExameFisico } from './etapas/EtapaExameFisico'
import { EtapaExamesComplementares } from './etapas/EtapaExamesComplementares'
import { EtapaHistoricoClinico } from './etapas/EtapaHistoricoClinico'
import { EtapaIdentificacao } from './etapas/EtapaIdentificacao'
import {
  agoraComoInicio,
  carregarRascunho,
  descartarRascunho,
  salvarConsulta,
  type InicioAtendimento,
} from './salvarAtendimento'
import { useAtendimentosEmAndamento } from './useAtendimentosEmAndamento'

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

const horaAtual = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

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
  const [participantes, setParticipantes] = useState<string[]>([])
  const [mensagem, setMensagem] = useState('')
  const [salvando, setSalvando] = useState(false)
  const travaSalvar = useRef(false)
  const [concluido, setConcluido] = useState<AtendimentoFinalizado | null>(null)
  const [idAgendamentoSelecionado, setIdAgendamentoSelecionado] = useState<number | null>(
    agendamentoInicial?.id ?? null,
  )
  const { agendamentos, atualizarAgendamento } = useAgendamentos()
  const emAndamento = useAtendimentosEmAndamento()
  const [veterinarios, setVeterinarios] = useState<OpcaoVeterinario[]>([])
  const [estudantes, setEstudantes] = useState<OpcaoEstudante[]>([])
  const [liberacao, setLiberacao] = useState<Liberacao | null>(null)
  const [idRascunho, setIdRascunho] = useState<number | null>(null)
  const [inicio, setInicio] = useState<InicioAtendimento | null>(null)
  const [supervisorRascunho, setSupervisorRascunho] = useState('')

  useEffect(() => {
    let ativo = true
    Promise.all([supervisaoService.listarVeterinarios(), supervisaoService.listarEstudantes()])
      .then(([listaVeterinarios, listaEstudantes]) => {
        if (!ativo) return
        setVeterinarios(listaVeterinarios)
        setEstudantes(listaEstudantes)
        setDados((atual) => aplicarVeterinario(atual, listaVeterinarios, null, emailUsuario))
      })
      .catch(() => {
        if (ativo) setMensagem('Não foi possível carregar a lista de veterinários e estudantes.')
      })
    return () => {
      ativo = false
    }
  }, [emailUsuario])

  function tratarLiberacao(nova: Liberacao) {
    setLiberacao(nova)
    setParticipantes(nova.participantes.map((participante) => participante.idPerfil))
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

  function alternarParticipante(idPerfil: string) {
    setParticipantes((atual) =>
      atual.includes(idPerfil) ? atual.filter((id) => id !== idPerfil) : [...atual, idPerfil],
    )
  }

  async function mudarSituacaoAgendamento(id: number | null, status: Agendamento['status']) {
    if (id === null) return
    try {
      if (!(await atualizarAgendamento(id, { status }))) setMensagem(AGENDA_NAO_ATUALIZADA)
    } catch {
      setMensagem(AGENDA_NAO_ATUALIZADA)
    }
  }

  async function salvar(finalizar: boolean) {
    if (travaSalvar.current || concluido) return
    if (ehEstudante && !liberacao && idRascunho === null) {
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
    const inicioAtual = inicio ?? agoraComoInicio()
    const primeiroSalvamento = idRascunho === null
    try {
      const resultado = await salvarConsulta(dados, exames, {
        idRascunho,
        inicio: inicioAtual,
        liberacaoId: ehEstudante && primeiroSalvamento ? (liberacao?.id ?? null) : null,
        participantes,
        agendamentoId: idAgendamentoSelecionado,
        finalizar,
      })
      if (!resultado.sucesso || resultado.id === undefined) {
        setMensagem(resultado.erro ?? 'Não foi possível salvar o atendimento. Os dados preenchidos foram mantidos.')
        return
      }
      void emAndamento.recarregar()
      if (finalizar) {
        setConcluido({
          dados: { ...dados },
          exames: structuredClone(exames),
          id: resultado.id,
          petId: resultado.petId,
        })
        setMensagem('Atendimento finalizado e salvo no prontuário.')
        await mudarSituacaoAgendamento(idAgendamentoSelecionado, 'completed')
        return
      }
      setIdRascunho(resultado.id)
      setInicio(inicioAtual)
      if (liberacao) setSupervisorRascunho(liberacao.supervisor.nome)
      setMensagem(
        `Atendimento salvo às ${horaAtual()}. Ele fica em "Atendimentos em andamento" até ser finalizado e só vai para o prontuário depois disso.`,
      )
      if (primeiroSalvamento) await mudarSituacaoAgendamento(idAgendamentoSelecionado, 'in-progress')
    } catch {
      setMensagem('Não foi possível salvar o atendimento. Verifique a conexão e tente novamente.')
    } finally {
      travaSalvar.current = false
      setSalvando(false)
    }
  }

  async function continuarRascunho(id: number) {
    if (salvando) return
    setSalvando(true)
    setMensagem('')
    try {
      const rascunho = await carregarRascunho(id)
      setDados(rascunho.dados)
      setExames(rascunho.exames)
      setParticipantes(rascunho.participantes)
      setIdAgendamentoSelecionado(rascunho.agendamentoId)
      setIdRascunho(rascunho.id)
      setInicio(rascunho.inicio)
      setSupervisorRascunho(rascunho.supervisorNome)
      setLiberacao(null)
      setEtapa(1)
      setMensagem(`Atendimento nº ${rascunho.id} aberto para continuar.`)
    } catch (erro) {
      setMensagem((erro as Error).message)
      void emAndamento.recarregar()
    } finally {
      setSalvando(false)
    }
  }

  async function descartar(item: AtendimentoEmAndamento) {
    const confirmado = window.confirm(
      `Descartar o atendimento em andamento nº ${item.id} de ${item.nomePet}? Os dados preenchidos serão apagados e não vão para o prontuário.`,
    )
    if (!confirmado) return
    setSalvando(true)
    setMensagem('')
    try {
      await descartarRascunho(item.id)
      const agendamento = agendamentos.find((atual) => atual.id === item.agendamentoId)
      if (agendamento?.status === 'in-progress') await mudarSituacaoAgendamento(agendamento.id, 'confirmed')
      if (item.id === idRascunho) iniciarNova()
      setMensagem(`Atendimento nº ${item.id} descartado.`)
    } catch (erro) {
      setMensagem((erro as Error).message)
    } finally {
      setSalvando(false)
      void emAndamento.recarregar()
    }
  }

  function iniciarNova() {
    setConcluido(null)
    setExames([])
    setParticipantes([])
    setLiberacao(null)
    setIdRascunho(null)
    setInicio(null)
    setSupervisorRascunho('')
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

  const listaEmAndamento = (
    <AtendimentosEmAndamento
      itens={emAndamento.itens}
      erro={emAndamento.erro}
      idAberto={idRascunho}
      ocupado={salvando}
      aoContinuar={(id) => void continuarRascunho(id)}
      aoDescartar={(item) => void descartar(item)}
    />
  )

  if (ehEstudante && !liberacao && idRascunho === null)
    return (
      <section className="clinical-care-module">
        {listaEmAndamento}
        {mensagem && (
          <p className="consultation-message" role="status">
            {mensagem}
          </p>
        )}
        <TelaLiberacao aoLiberar={tratarLiberacao} />
      </section>
    )

  return (
    <section className="clinical-care-module">
      {listaEmAndamento}
      {idRascunho !== null ? (
        <AvisoRascunho id={idRascunho} inicio={inicio} supervisorNome={supervisorRascunho} />
      ) : (
        liberacao && (
          <AvisoLiberacao liberacao={liberacao} aoAlterar={() => void trocarLiberacao()} desabilitado={salvando} />
        )
      )}
      <fieldset className="consultation-edit-fields" disabled={salvando}>
        <CabecalhoAtendimento etapaAtual={etapa} aoAlterarEtapa={setEtapa} />
        {etapa === 1 && (
          <EtapaIdentificacao
            dados={dados}
            agendamentos={agendamentosAbertos(agendamentos)}
            responsaveis={nomesResponsaveis(pets)}
            idAgendamentoSelecionado={idAgendamentoSelecionado}
            aoSelecionarAgendamento={selecionarAgendamento}
            atualizar={atualizar}
            aoAvancar={() => setEtapa(2)}
            veterinarios={veterinarios}
            veterinarioBloqueado={ehEstudante}
            estudantes={estudantes}
            participantes={participantes}
            aoAlternarParticipante={alternarParticipante}
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
        <button className="draft-button" disabled={salvando} onClick={() => void salvar(false)}>
          {salvando ? 'Salvando...' : 'Salvar e continuar depois'}
        </button>
        <button className="record-button" disabled={salvando} onClick={() => void salvar(true)}>
          {salvando ? 'Salvando atendimento...' : 'Finalizar atendimento e salvar no prontuário'}
        </button>
      </div>
    </section>
  )
}
