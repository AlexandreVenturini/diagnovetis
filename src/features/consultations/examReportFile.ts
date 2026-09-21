import type { LaudoAnexo } from '../../models/Exame'

export const MAX_REPORT_BYTES = 5 * 1024 * 1024
const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']

export function validateReportAttachment(attachment: LaudoAnexo): string {
  if (!allowedTypes.includes(attachment.tipo) || !attachment.dados.startsWith(`data:${attachment.tipo};base64,`)) return 'Use um arquivo PDF, JPG ou PNG.'
  const encoded = attachment.dados.split(',')[1]
  if (!encoded || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) return 'O arquivo do laudo é inválido.'
  if (encoded.length > 4 * Math.ceil(MAX_REPORT_BYTES / 3)) return 'O laudo deve ter no máximo 5 MB.'
  return ''
}

export async function readReportFile(file: File): Promise<LaudoAnexo> {
  if (!allowedTypes.includes(file.type)) throw new Error('Use um arquivo PDF, JPG ou PNG.')
  if (!file.size || file.size > MAX_REPORT_BYTES) throw new Error('Selecione um arquivo não vazio de até 5 MB.')
  const bytes = new Uint8Array(await file.arrayBuffer())
  const valid = file.type === 'application/pdf' ? new TextDecoder().decode(bytes.slice(0, 5)) === '%PDF-'
    : file.type === 'image/jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      : [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte)
  if (!valid) throw new Error('O conteúdo do arquivo não corresponde a um PDF, JPG ou PNG válido.')
  let binary = ''
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192))
  return { nome: file.name, tipo: file.type, dados: `data:${file.type};base64,${btoa(binary)}` }
}
