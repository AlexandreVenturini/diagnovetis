import { useCallback, useEffect, useRef, useState } from 'react'
import type { NivelRisco, Condicao, DadosFormularioCondicao } from './condicaoTipos'
import { DADOS_CLINICOS_VAZIOS } from './condicaoTipos'
import { Zoonose } from '../../models/Zoonose'
import { ZoonoseService } from '../../services/ZoonoseService'

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
  const [zoonoses, setZoonoses] = useState<Condicao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null)
  const requisicao = useRef(0)

  const buscarItens = useCallback(() => {
    const versao = ++requisicao.current
    return servico
      .listarZoonoses()
      .then((listar) => {
        if (versao === requisicao.current) {
          setZoonoses(listar.map(zoonoseParaCondicao))
          setErro('')
          setAtualizadoEm(new Date())
        }
      })
      .catch(() => {
        if (versao === requisicao.current)
          setErro('Não foi possível atualizar o catálogo. Confira sua conexão e tente novamente.')
      })
      .finally(() => {
        if (versao === requisicao.current) setCarregando(false)
      })
  }, [])

  useEffect(() => {
    const controle = requisicao
    void buscarItens()
    return () => {
      controle.current++
    }
  }, [buscarItens])
  function recarregar() {
    setCarregando(true)
    return buscarItens()
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
    setZoonoses((atual) => [...atual, zoonoseParaCondicao(item)])
    setAtualizadoEm(new Date())
  }

  return { zoonoses, carregando, erro, atualizadoEm, recarregar, criarCondicao }
}
