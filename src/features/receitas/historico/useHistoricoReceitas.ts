import { useCallback, useState } from 'react'
import { ReceitaService, type ReceitaEmitida } from '../../../services/ReceitaService'
import { usePeriodo } from '../../shared/usePeriodo'
import { useDadosPorIntervalo } from '../../shared/useDadosPorIntervalo'
import { intervaloPeriodo, type Intervalo } from '../../shared/periodo'
import { dataParaCampo, filtrarHistoricoReceitas, type FiltrosHistorico } from './filtrosHistorico'

const servico = new ReceitaService()

export function useHistoricoReceitas() {
  const [periodo, setPeriodo] = usePeriodo('receituario')
  const [filtrosExtras, setFiltrosExtras] = useState({ busca: '', veterinario: '', medicamento: '' })
  const filtros: FiltrosHistorico = { ...periodo, ...filtrosExtras }
  const buscando = Boolean(filtrosExtras.busca.trim())
  const intervalo = buscando ? null : intervaloPeriodo(periodo)
  const buscarHistorico = useCallback((alvo: Intervalo | null) => servico.listar(undefined, alvo), [])
  const dados = useDadosPorIntervalo(buscarHistorico, (linha: ReceitaEmitida) => linha.id, intervalo)

  function setFiltros(valor: FiltrosHistorico) {
    setPeriodo({ visao: valor.visao, data: valor.data })
    setFiltrosExtras({ busca: valor.busca, veterinario: valor.veterinario, medicamento: valor.medicamento })
  }

  function mostrarEmitida(linha: ReceitaEmitida) {
    dados.inserirOuAtualizar([linha])
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
    reiniciar: dados.reiniciar,
    mostrarEmitida,
  }
}
