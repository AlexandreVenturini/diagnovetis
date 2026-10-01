import { useRef, useState } from 'react'
import { ReceitaService, type ReceitaEmitida } from '../../../services/ReceitaService'
import { SupervisaoService } from '../../../services/SupervisaoService'

type ArgumentosEmissao = Parameters<ReceitaService['emitir']>

const servico = new ReceitaService()
const supervisaoService = new SupervisaoService()

export function useEmissaoReceita() {
  const [salvando, setSalvando] = useState(false)
  const [emissaoPendente, setEmissaoPendente] = useState(false)
  const trava = useRef(false)
  const pendentes = useRef<ArgumentosEmissao | null>(null)

  async function emitir(montar: () => ArgumentosEmissao): Promise<ReceitaEmitida | null> {
    if (trava.current) return null
    trava.current = true
    setSalvando(true)
    try {
      pendentes.current ??= montar()
      setEmissaoPendente(true)
      return await servico.emitir(...pendentes.current)
    } finally {
      trava.current = false
      setSalvando(false)
    }
  }

  async function emitirAprovada(liberacaoId: string): Promise<ReceitaEmitida> {
    setSalvando(true)
    try {
      return await servico.buscar(await supervisaoService.emitirReceita(liberacaoId))
    } finally {
      setSalvando(false)
    }
  }

  function limpar() {
    pendentes.current = null
    setEmissaoPendente(false)
  }

  return { salvando, emissaoPendente, emitir, emitirAprovada, limpar }
}
