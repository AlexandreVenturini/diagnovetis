import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { NivelRisco, Condicao, DadosFormularioCondicao } from './condicaoTipos'
import { DADOS_CLINICOS_VAZIOS } from './condicaoTipos'
import { Zoonose } from '../../models/Zoonose'
import { ZoonoseService } from '../../services/ZoonoseService'
import { CHAVES } from '../shared/consultas'

const servico = new ZoonoseService()
const riscos: Record<NivelRisco, string> = { Alto: 'alto', Médio: 'medio', Baixo: 'baixo' }
const rotulosRisco: Record<string, NivelRisco> = { alto: 'Alto', medio: 'Médio', baixo: 'Baixo' }

export function zoonoseParaCondicao(z: Zoonose): Condicao {
  const dadosClinicos = { ...DADOS_CLINICOS_VAZIOS, ...z.dadosClinicos }
  return {
    id: z.id,
    nome: z.nome,
    agente: z.agenteEtiologico,
    risco: rotulosRisco[z.grauRisco] ?? 'Médio',
    dadosClinicos,
    prevalencia: dadosClinicos.prevalencia,
    hospedeiros: dadosClinicos.hospedeiros,
    transmissao: dadosClinicos.transmissao,
    sintomas: z.sintomas
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    examesSugeridos: dadosClinicos.examesSugeridos,
    prevencao: z.medidasPreventivas
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  }
}

export function useCondicoes() {
  const cliente = useQueryClient()
  const consulta = useQuery({
    queryKey: CHAVES.condicoes,
    queryFn: async () => (await servico.listarZoonoses()).map(zoonoseParaCondicao),
  })

  function recarregar() {
    return cliente.invalidateQueries({ queryKey: CHAVES.condicoes })
  }

  async function criarCondicao(formulario: DadosFormularioCondicao) {
    const listar = await servico.listarZoonoses()
    const id = Math.max(0, ...listar.map((item) => item.id)) + 1
    const item = new Zoonose(
      id,
      formulario.nome,
      formulario.agente,
      formulario.sintomas.join(', '),
      formulario.prevencao.join(', '),
      riscos[formulario.risco],
    )
    item.dadosClinicos = {
      ...formulario.dadosClinicos,
      hospedeiros: formulario.hospedeiros,
      transmissao: formulario.transmissao,
      examesSugeridos: formulario.examesSugeridos,
      prevalencia: formulario.prevalencia,
    }
    await servico.adicionarZoonose(item)
    cliente.setQueryData<Condicao[]>(CHAVES.condicoes, (atual) => [...(atual ?? []), zoonoseParaCondicao(item)])
    void recarregar()
  }

  return {
    zoonoses: consulta.data ?? [],
    carregando: consulta.isFetching,
    erro: consulta.isError ? 'Não foi possível atualizar o catálogo. Confira sua conexão e tente novamente.' : '',
    atualizadoEm: consulta.dataUpdatedAt ? new Date(consulta.dataUpdatedAt) : null,
    recarregar,
    criarCondicao,
  }
}
