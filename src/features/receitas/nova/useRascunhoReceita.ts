import { useState } from 'react'
import type { Medico } from '../../../models/Medico'
import type { Medicamento } from '../../../models/Medicamento'
import { ATENDIMENTO_VAZIO } from '../../atendimentos/atendimentoTipos'
import { receitaVazia, itemReceitaVazio, type Receita } from '../receita'
import type { PetResumo } from '../../pets/petTipos'
import { aplicarDoseNaReceita, valorDecimal } from './aplicarDose'
import { calcularDose } from './calculoDose'

const VETERINARIO_ESTUDANTE = 'Veterinário que aprovar a receita'
const CRMV_ESTUDANTE = 'Definido na aprovação'

export type RetornoDose = { entradas: string; texto: string; erro: boolean }

const temConteudo = (item: Receita['itens'][number]) => Object.values(item).some((valor) => valor.trim())

export function useRascunhoReceita(pets: PetResumo[], medicos: Medico[], ehEstudante: boolean) {
  const [petId, setPetId] = useState('')
  const [veterinarioId, setVeterinarioId] = useState('')
  const [peso, setPeso] = useState('')
  const [receita, setReceita] = useState(receitaVazia)
  const [buscaMedicamento, setBuscaMedicamento] = useState('')
  const [mgKg, setMgKg] = useState('')
  const [concentracao, setConcentracao] = useState('')
  const [retornoDose, setRetornoDose] = useState<RetornoDose | null>(null)
  const [itemAlvo, setItemAlvo] = useState(0)

  const pet = pets.find((item) => item.id === Number(petId))
  const veterinario = medicos.find((item) => item.id === Number(veterinarioId))
  const paciente = {
    ...ATENDIMENTO_VAZIO,
    nomePet: pet?.nome ?? '',
    nomeTutor: pet?.tutor ?? '',
    raca: pet?.raca ?? '',
    idade: pet?.idade ?? '',
    veterinario: ehEstudante ? VETERINARIO_ESTUDANTE : (veterinario?.nome ?? ''),
    peso,
    idPaciente: petId,
  }
  const receitaVisualizada = ehEstudante ? { ...receita, crmv: CRMV_ESTUDANTE } : receita
  const entradasDose = JSON.stringify([petId, peso, mgKg, concentracao, itemAlvo, receita.itens[itemAlvo]?.medicamento])

  function reiniciarDose(proximaConcentracao = '') {
    setMgKg('')
    setConcentracao(proximaConcentracao)
  }

  function reiniciar() {
    setPetId('')
    setVeterinarioId('')
    setPeso('')
    setReceita(receitaVazia())
    reiniciarDose()
    setItemAlvo(0)
    setRetornoDose(null)
    setBuscaMedicamento('')
  }

  function selecionarPet(proximo: PetResumo | null) {
    setPetId(proximo ? String(proximo.id) : '')
    setPeso(proximo?.peso.replace(/\s*kg\s*$/i, '').trim() ?? '')
    setReceita((atual) => ({ ...receitaVazia(), crmv: atual.crmv }))
    reiniciarDose()
    setItemAlvo(0)
    setRetornoDose(null)
  }

  function alterarPeso(valor: string) {
    setPeso(valor)
    setMgKg('')
  }

  function selecionarVeterinario(id: string) {
    setVeterinarioId(id)
    setReceita((atual) => ({ ...atual, crmv: medicos.find((item) => item.id === Number(id))?.crmv ?? '' }))
  }

  function adicionarMedicamento(item: Medicamento) {
    const adicionado = {
      ...itemReceitaVazio(),
      medicamento: `${item.nome} — ${item.concentracao} ${item.unidadeConcentracao} — ${item.formaFarmaceutica}`,
      via: item.viaAdministracao,
    }
    const itens = receita.itens.filter(temConteudo)
    setReceita({ ...receita, itens: [...itens, adicionado] })
    setItemAlvo(itens.length)
    const ehMgPorMl = item.unidadeConcentracao.toLowerCase().replaceAll(' ', '') === 'mg/ml'
    reiniciarDose(ehMgPorMl ? String(item.concentracao) : '')
    setBuscaMedicamento('')
  }

  function selecionarAlvo(indice: number) {
    setItemAlvo(indice)
    reiniciarDose()
  }

  function aplicarDose() {
    if (!pet) {
      setRetornoDose({
        entradas: entradasDose,
        texto: 'Busque e selecione o animal antes de aplicar a dose.',
        erro: true,
      })
      return
    }
    const aplicado = aplicarDoseNaReceita(receita, itemAlvo, peso, mgKg, concentracao)
    if (!aplicado.erro) setReceita(aplicado.receita)
    setRetornoDose({
      entradas: entradasDose,
      texto:
        aplicado.erro ||
        `Dose aplicada a ${receita.itens[itemAlvo].medicamento}: ${aplicado.dose}. O campo Dose por administração foi preenchido na receita abaixo.`,
      erro: !!aplicado.erro,
    })
  }

  function alterarReceita(valor: Receita) {
    setReceita(valor)
    if (valor.itens.length !== receita.itens.length) {
      setItemAlvo(0)
      reiniciarDose()
    }
  }

  return {
    pet,
    veterinario,
    veterinarioId,
    peso,
    paciente,
    receita,
    receitaVisualizada,
    buscaMedicamento,
    setBuscaMedicamento,
    mgKg,
    setMgKg,
    concentracao,
    setConcentracao,
    itemAlvo,
    calculo: calcularDose(valorDecimal(peso), valorDecimal(mgKg), valorDecimal(concentracao)),
    retornoDose: retornoDose?.entradas === entradasDose ? retornoDose : null,
    temPesoValido: Number.isFinite(valorDecimal(peso)) && valorDecimal(peso) > 0,
    reiniciar,
    selecionarPet,
    alterarPeso,
    selecionarVeterinario,
    adicionarMedicamento,
    selecionarAlvo,
    aplicarDose,
    alterarReceita,
  }
}

export type RascunhoReceita = ReturnType<typeof useRascunhoReceita>
