import { useState } from 'react'
import { FormularioAgendamento } from './FormularioAgendamento'
import { ListaAgendamentos } from './ListaAgendamentos'
import { useAgendamentos } from './useAgendamentos'
import { usePeriodo } from '../shared/usePeriodo'
import { intervaloPeriodo } from '../shared/periodo'
import type { Agendamento, DadosFormularioAgendamento, TelaAgenda } from './agendaTipos'
import type { PetResumo } from '../pets/petTipos'

type ModuloAgendaProps = {
  telaInicial?: TelaAgenda
  pets: PetResumo[]
  aoIniciarAtendimento?: (agendamento: Agendamento) => void
}

export function ModuloAgenda({ telaInicial = 'lista', pets, aoIniciarAtendimento }: ModuloAgendaProps) {
  const [tela, setTela] = useState<TelaAgenda>(telaInicial)
  const [erroFormulario, setErroFormulario] = useState('')
  const [periodo, setPeriodo] = usePeriodo('agenda')
  const [busca, setBusca] = useState('')
  const intervalo = busca.trim() ? null : intervaloPeriodo(periodo)
  const { agendamentos, agendamentosComLembrete, carregando, temConflito, criarAgendamento, atualizarAgendamento } =
    useAgendamentos(intervalo)

  async function tratarCriacao(dados: DadosFormularioAgendamento) {
    const ok = await criarAgendamento(dados)
    if (!ok) {
      setErroFormulario('Este veterinário já possui uma consulta agendada nesse horário.')
      return false
    }
    setErroFormulario('')
    setTela('lista')
    return true
  }

  if (tela === 'cadastro') {
    return (
      <FormularioAgendamento
        pets={pets}
        aoSalvar={tratarCriacao}
        aoCancelar={() => {
          setErroFormulario('')
          setTela('lista')
        }}
        erro={erroFormulario}
      />
    )
  }

  return (
    <ListaAgendamentos
      aoIniciarAtendimento={aoIniciarAtendimento}
      agendamentos={agendamentos}
      aoCriar={() => setTela('cadastro')}
      aoAtualizar={atualizarAgendamento}
      periodo={periodo}
      aoAlterarPeriodo={setPeriodo}
      busca={busca}
      aoAlterarBusca={setBusca}
      agendamentosComLembrete={agendamentosComLembrete}
      aoVerificarConflito={temConflito}
      carregando={carregando}
    />
  )
}
