import { useMemo, useState } from 'react'
import type { Papel } from '../acesso/perfil'
import { usePeriodo } from '../shared/usePeriodo'
import { useDadosPorIntervalo } from '../shared/useDadosPorIntervalo'
import { intervaloPeriodo } from '../shared/periodo'
import type { ResumoProntuario } from './ListaProntuarios'
import { TelaListaProntuarios } from './TelaListaProntuarios'
import { DetalhesProntuario } from './ficha/DetalhesProntuario'
import { EditorRetificacao } from './retificacao/EditorRetificacao'
import { FormularioObito } from './obito/FormularioObito'
import { resumirProntuarios, type ItemResumo } from './resumoProntuarios'
import { buscarResumos } from './carregarProntuarios'
import { useProntuario } from './useProntuario'

type Tela = 'lista' | 'detalhes' | 'retificacao' | 'obito'

type ModuloProntuariosProps = {
  petIdInicial?: number
  papel?: Papel
  emailUsuario?: string
}

export function ModuloProntuarios({ petIdInicial, papel = 'veterinarian', emailUsuario }: ModuloProntuariosProps) {
  const [tela, setTela] = useState<Tela>(petIdInicial ? 'detalhes' : 'lista')
  const [idSelecionado, setIdSelecionado] = useState<number | null>(petIdInicial ?? null)
  const [busca, setBusca] = useState('')
  const [periodo, setPeriodo] = usePeriodo('prontuarios')
  const [idRetificacao, setIdRetificacao] = useState<number | null>(null)
  const [avisoDetalhes, setAvisoDetalhes] = useState('')
  const [chaveDetalhes, setChaveDetalhes] = useState(0)
  const prontuario = useProntuario(petIdInicial)
  const selecionado = prontuario.paciente

  const intervalo = busca.trim() ? null : intervaloPeriodo(periodo)
  const resumos = useDadosPorIntervalo(buscarResumos, (item: ItemResumo) => item.key, intervalo)
  const pacientes = useMemo(
    () => resumirProntuarios(resumos.itens, busca, intervalo),
    [resumos.itens, busca, intervalo],
  )

  function abrirPaciente(paciente: ResumoProntuario) {
    setIdRetificacao(null)
    setAvisoDetalhes('')
    prontuario.limpar()
    setIdSelecionado(paciente.id)
    setTela('detalhes')
    void prontuario.carregar(paciente.id)
  }

  function abrirRetificacao(atendimentoId: number) {
    setIdRetificacao(atendimentoId)
    setAvisoDetalhes('')
    setTela('retificacao')
  }

  function abrirFormularioObito() {
    setAvisoDetalhes('')
    setTela('obito')
  }

  async function voltarAosDetalhes(mensagem: string) {
    if (idSelecionado !== null) await prontuario.carregar(idSelecionado)
    void resumos.recarregar().catch(() => {})
    setAvisoDetalhes(mensagem)
    setChaveDetalhes((anterior) => anterior + 1)
    setTela('detalhes')
  }

  if (tela === 'lista')
    return (
      <TelaListaProntuarios
        papel={papel}
        pacientes={pacientes}
        carregando={resumos.carregando}
        erro={resumos.erro}
        periodo={periodo}
        aoAlterarPeriodo={setPeriodo}
        busca={busca}
        aoAlterarBusca={setBusca}
        aoSelecionar={abrirPaciente}
      />
    )

  if (prontuario.carregando)
    return (
      <section className="records-module">
        <div className="empty-appointments">Carregando prontuário...</div>
      </section>
    )

  if (!selecionado)
    return (
      <section className="records-module">
        <div className="empty-appointments">{prontuario.erro || 'Paciente não encontrado.'}</div>
        <button className="text-back-button" onClick={() => setTela('lista')}>
          ‹ Prontuários
        </button>
      </section>
    )

  if (tela === 'obito')
    return (
      <FormularioObito
        petId={selecionado.id}
        nomePet={selecionado.nomePet}
        papel={papel}
        emailUsuario={emailUsuario}
        atendimentos={selecionado.atendimentos}
        existente={selecionado.obito}
        aoConcluir={(mensagem) => void voltarAosDetalhes(mensagem)}
        aoCancelar={() => setTela('detalhes')}
      />
    )

  if (tela === 'retificacao' && idRetificacao !== null)
    return (
      <EditorRetificacao
        consultaId={idRetificacao}
        papel={papel}
        aoConcluir={(mensagem) => void voltarAosDetalhes(mensagem)}
        aoCancelar={() => setTela('detalhes')}
      />
    )

  return (
    <DetalhesProntuario
      key={chaveDetalhes}
      selecionado={selecionado}
      aoVoltar={() => {
        setAvisoDetalhes('')
        setTela('lista')
      }}
      aoSalvarExame={prontuario.substituirExame}
      aoRetificar={abrirRetificacao}
      aoRegistrarObito={abrirFormularioObito}
      aoRetificarObito={abrirFormularioObito}
      podeEditarExames={papel === 'veterinarian'}
      podeRetificarObito={papel === 'veterinarian'}
      atendimentoInicialId={idRetificacao ?? undefined}
      avisoInicial={avisoDetalhes}
    />
  )
}
