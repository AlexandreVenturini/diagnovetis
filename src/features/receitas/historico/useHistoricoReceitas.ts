import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ReceitaService, type ReceitaEmitida } from '../../../services/ReceitaService'
import { usePeriodo } from '../../shared/usePeriodo'
import { CHAVES } from '../../shared/consultas'
import { useDadosPorPeriodo } from '../../shared/useDadosPorPeriodo'
import { intervaloPeriodo, type Intervalo } from '../../shared/periodo'
import { dataParaCampo, filtrarHistoricoReceitas, type FiltrosHistorico } from './filtrosHistorico'

const servico = new ReceitaService()
const buscarHistorico = (alvo: Intervalo | null) => servico.listar(undefined, alvo)
const chaveReceita = (linha: ReceitaEmitida) => linha.id

export function useHistoricoReceitas() {
  const cliente = useQueryClient()
  const [periodo, setPeriodo] = usePeriodo('receituario')
  const [filtrosExtras, setFiltrosExtras] = useState({ busca: '', veterinario: '', medicamento: '' })
  const filtros: FiltrosHistorico = { ...periodo, ...filtrosExtras }
  const buscando = Boolean(filtrosExtras.busca.trim())
  const intervalo = buscando ? null : intervaloPeriodo(periodo)
  const dados = useDadosPorPeriodo(CHAVES.receitas, buscarHistorico, chaveReceita, intervalo)

  function setFiltros(valor: FiltrosHistorico) {
    setPeriodo({ visao: valor.visao, data: valor.data })
    setFiltrosExtras({ busca: valor.busca, veterinario: valor.veterinario, medicamento: valor.medicamento })
  }

  function mostrarEmitida(linha: ReceitaEmitida) {
    dados.inserirOuAtualizar([linha])
    void cliente.invalidateQueries({ queryKey: CHAVES.receitasDoPet })
    setFiltros({
      visao: periodo.visao,
      data: dataParaCampo(new Date(linha.snapshot.emitidaEm)),
      busca: '',
      veterinario: '',
      medicamento: '',
    })
  }

  return {
    historico: dados.itens,
    filtrados: filtrarHistoricoReceitas(dados.itens, filtros),
    filtros,
    setFiltros,
    buscando,
    carregando: dados.carregando,
    erro: dados.erro,
    reiniciar: dados.recarregar,
    mostrarEmitida,
  }
}
