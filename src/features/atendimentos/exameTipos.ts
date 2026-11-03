import { validarAnexoLaudo } from './arquivoLaudo'
import { limparDados, modeloDoExame, validarDados, type ModeloExame } from './catalogoExames'
import {
  Exame,
  EXAME_STATUS,
  type DadosExame,
  type ExameCategoria,
  type ExameStatus,
  type LaudoAnexo,
} from '../../models/Exame'

export type RascunhoExame = {
  laudoCarregando?: boolean
  laudo?: string
  laudoAnexo?: LaudoAnexo | null
  key: string
  modelo: string | null
  dados: DadosExame
  nome: string
  categoria: ExameCategoria
  dataSolicitacao: string
  dataRealizacao: string
  status: ExameStatus
  resultado: string
  interpretacao: string
}
export const dataLocal = (data = new Date()) =>
  `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`
export const novoExame = (nome: string, categoria: ExameCategoria, modelo: string | null = null): RascunhoExame => ({
  key: crypto.randomUUID(),
  modelo,
  dados: {},
  nome,
  categoria,
  dataSolicitacao: dataLocal(),
  dataRealizacao: '',
  laudo: '',
  laudoAnexo: null,
  status: 'solicitado',
  resultado: '',
  interpretacao: '',
})
export const exameDoModelo = (modelo: ModeloExame) => novoExame(modelo.nome, modelo.categoria, modelo.id)
export const modeloDoRascunho = (rascunho: Pick<RascunhoExame, 'modelo' | 'nome'>) =>
  modeloDoExame(rascunho.modelo, rascunho.nome)
export function validarExame(rascunho: RascunhoExame): string {
  if (rascunho.laudoCarregando) return 'Aguarde o carregamento do anexo do laudo.'
  if (rascunho.laudoAnexo) {
    const erro = validarAnexoLaudo(rascunho.laudoAnexo)
    if (erro) return erro
  }
  if (!rascunho.nome.trim()) return 'Informe o nome de cada exame.'
  if (!['laboratorial', 'imagem', 'outro'].includes(rascunho.categoria) || !EXAME_STATUS.includes(rascunho.status))
    return 'Categoria ou status de exame inválido.'
  const erroDados = validarDados(modeloDoRascunho(rascunho), rascunho.dados)
  if (erroDados) return `${rascunho.nome.trim()}: ${erroDados}`
  const dataValida = (valor: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(valor) &&
    !Number.isNaN(Date.parse(valor)) &&
    new Date(valor).toISOString().slice(0, 10) === valor
  if (!dataValida(rascunho.dataSolicitacao) || rascunho.dataSolicitacao > dataLocal())
    return 'Informe uma data de solicitação válida, até hoje.'
  if (
    rascunho.dataRealizacao &&
    (!dataValida(rascunho.dataRealizacao) ||
      rascunho.dataRealizacao < rascunho.dataSolicitacao ||
      rascunho.dataRealizacao > dataLocal())
  )
    return 'A realização deve ocorrer entre a solicitação e hoje.'
  if (rascunho.status === 'concluido' && (!rascunho.resultado.trim() || !rascunho.dataRealizacao))
    return `${rascunho.nome.trim()}: para concluir, informe a data de realização e o resumo do resultado.`
  return ''
}
export function rascunhoParaExame(rascunho: RascunhoExame): Exame {
  const erro = validarExame(rascunho)
  if (erro) throw new Error(erro)
  const exame = new Exame(
    0,
    rascunho.nome.trim(),
    new Date(`${rascunho.dataSolicitacao}T12:00:00`),
    rascunho.resultado.trim(),
  )
  exame.categoria = rascunho.categoria
  exame.dataSolicitacao = new Date(`${rascunho.dataSolicitacao}T12:00:00`)
  exame.dataRealizacao = rascunho.dataRealizacao ? new Date(`${rascunho.dataRealizacao}T12:00:00`) : null
  exame.status = rascunho.status
  exame.interpretacao = rascunho.interpretacao.trim()
  exame.laudo = rascunho.laudo?.trim() ?? ''
  exame.laudoAnexo = rascunho.laudoAnexo ?? null
  const modelo = modeloDoRascunho(rascunho)
  exame.modelo = modelo?.id ?? null
  exame.dados = limparDados(modelo, rascunho.dados)
  return exame
}
export function exameParaRascunho(exame: Exame): RascunhoExame {
  return {
    laudo: exame.laudo,
    laudoAnexo: exame.laudoAnexo,
    key: String(exame.id),
    modelo: exame.modelo,
    dados: structuredClone(exame.dados),
    nome: exame.nomeExame,
    categoria: exame.categoria,
    dataSolicitacao: dataLocal(exame.dataSolicitacao),
    dataRealizacao: exame.dataRealizacao ? dataLocal(exame.dataRealizacao) : '',
    status: exame.status,
    resultado: exame.resultado,
    interpretacao: exame.interpretacao,
  }
}
