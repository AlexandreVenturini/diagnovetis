import type { LaudoAnexo } from '../../models/Exame'

export const TAMANHO_MAXIMO_LAUDO = 2 * 1024 * 1024
const TIPO_PDF = 'application/pdf'
const SOMENTE_PDF = 'Anexe o laudo em PDF. Fotos e imagens não são aceitas para economizar espaço no banco.'

export function validarAnexoLaudo(anexo: LaudoAnexo): string {
  if (anexo.tipo !== TIPO_PDF || !anexo.dados.startsWith(`data:${TIPO_PDF};base64,`)) return SOMENTE_PDF
  const codificado = anexo.dados.split(',')[1]
  if (!codificado || !/^[A-Za-z0-9+/]+={0,2}$/.test(codificado)) return 'O arquivo do laudo é inválido.'
  if (codificado.length > 4 * Math.ceil(TAMANHO_MAXIMO_LAUDO / 3)) return 'O laudo deve ter no máximo 2 MB.'
  return ''
}

export async function lerArquivoLaudo(arquivo: File): Promise<LaudoAnexo> {
  if (arquivo.type !== TIPO_PDF) throw new Error(SOMENTE_PDF)
  if (!arquivo.size || arquivo.size > TAMANHO_MAXIMO_LAUDO) throw new Error('Selecione um PDF não vazio de até 2 MB.')
  const bytes = new Uint8Array(await arquivo.arrayBuffer())
  if (new TextDecoder().decode(bytes.slice(0, 5)) !== '%PDF-')
    throw new Error('O conteúdo do arquivo não corresponde a um PDF válido.')
  let binario = ''
  for (let i = 0; i < bytes.length; i += 8192) binario += String.fromCharCode(...bytes.subarray(i, i + 8192))
  return { nome: arquivo.name, tipo: TIPO_PDF, dados: `data:${TIPO_PDF};base64,${btoa(binario)}` }
}
