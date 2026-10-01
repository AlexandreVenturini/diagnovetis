import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { Agendamento } from '../agenda/agendaTipos'
import type { TelaPets } from '../pets/petTipos'

export type ModuloPainel =
  'inicio' | 'pets' | 'agenda' | 'atendimentos' | 'receitas' | 'prontuarios' | 'condicoes' | 'medicamentos'

type Entrada<S> = { tela: S; key: number }

function reabrir<S>(setEntrada: Dispatch<SetStateAction<Entrada<S>>>, tela: NoInfer<S>) {
  setEntrada((anterior) => ({ tela, key: anterior.key + 1 }))
}

export function useNavegacaoPainel() {
  const [moduloAtivo, setModuloAtivo] = useState<ModuloPainel>('inicio')
  const [entradaPets, setEntradaPets] = useState<Entrada<TelaPets>>({ tela: 'lista', key: 0 })
  const [entradaAgenda, setEntradaAgenda] = useState<Entrada<'lista' | 'cadastro'>>({ tela: 'lista', key: 0 })
  const [entradaAtendimento, setEntradaAtendimento] = useState<Entrada<Agendamento | undefined>>({
    tela: undefined,
    key: 0,
  })
  const [entradaProntuarios, setEntradaProntuarios] = useState<Entrada<number | undefined>>({ tela: undefined, key: 0 })

  function selecionarModulo(modulo: ModuloPainel) {
    if (modulo === 'atendimentos' && moduloAtivo !== 'atendimentos') reabrir(setEntradaAtendimento, undefined)
    if (modulo === 'prontuarios') reabrir(setEntradaProntuarios, undefined)
    if (modulo === 'pets') reabrir(setEntradaPets, 'lista')
    if (modulo === 'agenda') reabrir(setEntradaAgenda, 'lista')
    setModuloAtivo(modulo)
  }

  function abrirNovoPet() {
    reabrir(setEntradaPets, 'cadastro')
    setModuloAtivo('pets')
  }

  function abrirNovoAgendamento() {
    reabrir(setEntradaAgenda, 'cadastro')
    setModuloAtivo('agenda')
  }

  function iniciarAtendimento(agendamento: Agendamento) {
    reabrir(setEntradaAtendimento, agendamento)
    setModuloAtivo('atendimentos')
  }

  function abrirProntuario(petId: number) {
    reabrir(setEntradaProntuarios, petId)
    setModuloAtivo('prontuarios')
  }

  return {
    moduloAtivo,
    entradaPets,
    entradaAgenda,
    entradaAtendimento,
    entradaProntuarios,
    selecionarModulo,
    abrirNovoPet,
    abrirNovoAgendamento,
    iniciarAtendimento,
    abrirProntuario,
  }
}
