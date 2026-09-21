import { describe, expect, it } from 'vitest'
import { MAX_REPORT_BYTES, readReportFile, validateReportAttachment } from '../features/consultations/examReportFile'
import { newExam, validateExam } from '../features/consultations/examTypes'

describe('Anexos de laudos', () => {
  it('preserva nome e conteúdo do PDF', async () => {
    const result = await readReportFile(new File(['%PDF-1.7\nlaudo'], 'laudo.pdf', { type: 'application/pdf' }))
    expect(result.nome).toBe('laudo.pdf')
    expect(atob(result.dados.split(',')[1])).toBe('%PDF-1.7\nlaudo')
    expect(validateReportAttachment(result)).toBe('')
  })
  it('aceita as assinaturas de JPG e PNG', async () => {
    for (const [type, bytes] of [['image/jpeg', [255, 216, 255]], ['image/png', [137, 80, 78, 71, 13, 10, 26, 10]]] as const) {
      expect((await readReportFile(new File([new Uint8Array(bytes)], 'imagem', { type }))).tipo).toBe(type)
    }
  })
  it('rejeita conteúdo incompatível, arquivo vazio, tipo não permitido e arquivo grande', async () => {
    for (const file of [new File(['texto'], 'falso.pdf', { type: 'application/pdf' }), new File([], 'vazio.pdf', { type: 'application/pdf' }), new File(['<svg/>'], 'laudo.svg', { type: 'image/svg+xml' }), new File([new Uint8Array(MAX_REPORT_BYTES + 1)], 'grande.pdf', { type: 'application/pdf' })]) {
      await expect(readReportFile(file)).rejects.toThrow()
    }
  })
  it('impede salvar durante a leitura ou com URL inválida', () => {
    const exam = newExam('Hemograma', 'laboratorial')
    expect(validateExam({ ...exam, laudoCarregando: true })).toContain('Aguarde')
    expect(validateExam({ ...exam, laudoAnexo: { nome: 'laudo.pdf', tipo: 'application/pdf', dados: 'javascript:alert(1)' } })).not.toBe('')
  })
})
