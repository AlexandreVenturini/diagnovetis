import { describe, expect, it, vi } from 'vitest'
import { newExam, validateExam, draftToExam, localDate } from '../features/consultations/examTypes'
import { exameFromRow, exameToRow } from '../services/storage/exameMapping'
import { generateConsultationReport } from '../features/consultations/consultationReport'
import { EMPTY_CONSULTATION } from '../features/consultations/consultationTypes'

describe('Solicitação e resultado de exames', () => {
  it('permite solicitar sem resultado e acompanha todos os estados', () => {
    const draft = newExam('Exame manual', 'outro')
    for (const status of ['solicitado', 'agendado', 'coletado', 'aguardando_resultado', 'cancelado'] as const) expect(validateExam({ ...draft, status })).toBe('')
    expect(exameToRow(draftToExam(draft))).toMatchObject({ nome_exame: 'Exame manual', status: 'solicitado', data_realizacao: null, resultado: '' })
  })
  it('exige resultado e realização ao concluir e valida a ordem das datas', () => {
    const draft = newExam('Hemograma', 'laboratorial')
    expect(validateExam({ ...draft, status: 'concluido' })).not.toBe('')
    expect(validateExam({ ...draft, status: 'concluido', resultado: 'Teste', dataRealizacao: localDate() })).toBe('')
    expect(validateExam({ ...draft, dataRealizacao: '2000-01-01' })).not.toBe('')
    expect(validateExam({ ...draft, dataSolicitacao: '2025-02-30' })).not.toBe('')
    expect(validateExam({ ...draft, dataRealizacao: '2999-01-01' })).not.toBe('')
    expect(validateExam({ ...draft, nome: ' ' })).not.toBe('')
  })
  it('mantém compatibilidade com exames anteriores à migração', () => {
    const legacy = exameFromRow({ id: 1, consulta_id: 2, nome_exame: 'Antigo', data_exame: '2025-01-15T12:00:00Z', resultado: 'Resultado antigo' })
    expect(legacy.status).toBe('concluido')
    expect(legacy.dataRealizacao).not.toBeNull()
    expect(legacy.resultado).toBe('Resultado antigo')
    expect(legacy.categoria).toBe('outro')
    expect(exameFromRow({ id: 2, nome_exame: 'Pendente', data_exame: '2025-01-15T12:00:00Z', resultado: null }).status).toBe('solicitado')
  })
  it('inclui solicitações e resultados no relatório e escapa conteúdo digitado', () => {
    const write = vi.fn()
    vi.stubGlobal('window', { open: () => ({ document: { open: vi.fn(), write, close: vi.fn() } }) })
    try {
      generateConsultationReport(EMPTY_CONSULTATION, [{ ...newExam('<script>teste</script>', 'outro'), interpretacao: '<img src=x>' }])
      const html = write.mock.calls[0][0]
      expect(html).toContain('Exames complementares')
      expect(html).toContain('Aguardando resultado')
      expect(html).toContain('&lt;script&gt;')
      expect(html).not.toContain('<img src=x>')
    } finally { vi.unstubAllGlobals() }
  })
})
