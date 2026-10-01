import type { LaudoAnexo } from '../../models/Exame'

export const TAMANHO_MAXIMO_LAUDO = 5 * 1024 * 1024
const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/png']

export function validarAnexoLaudo(anexo: LaudoAnexo): string {
  if (!tiposPermitidos.includes(anexo.tipo) || !anexo.dados.startsWith(`data:${anexo.tipo};base64,`))
    return 'Use um arquivo PDF, JPG ou PNG.'
  const codificado = anexo.dados.split(',')[1]
  if (!codificado || !/^[A-Za-z0-9+/]+={0,2}$/.test(codificado)) return 'O arquivo do laudo é inválido.'
  if (codificado.length > 4 * Math.ceil(TAMANHO_MAXIMO_LAUDO / 3)) return 'O laudo deve ter no máximo 5 MB.'
  return ''
}

export async function lerArquivoLaudo(arquivo: File): Promise<LaudoAnexo> {
  if (!tiposPermitidos.includes(arquivo.type)) throw new Error('Use um arquivo PDF, JPG ou PNG.')
  if (!arquivo.size || arquivo.size > TAMANHO_MAXIMO_LAUDO)
    throw new Error('Selecione um arquivo não vazio de até 5 MB.')
  const bytes = new Uint8Array(await arquivo.arrayBuffer())
  const valido =
    arquivo.type === 'application/pdf'
      ? new TextDecoder().decode(bytes.slice(0, 5)) === '%PDF-'
      : arquivo.type === 'image/jpeg'
        ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        : [137, 80, 78, 71, 13, 10, 26, 10].every((byte, indice) => bytes[indice] === byte)
  if (!valido) throw new Error('O conteúdo do arquivo não corresponde a um PDF, JPG ou PNG válido.')
  let binario = ''
  for (let i = 0; i < bytes.length; i += 8192) binario += String.fromCharCode(...bytes.subarray(i, i + 8192))
  return { nome: arquivo.name, tipo: arquivo.type, dados: `data:${arquivo.type};base64,${btoa(binario)}` }
}
