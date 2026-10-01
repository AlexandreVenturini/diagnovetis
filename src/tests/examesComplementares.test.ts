import { describe, expect, it, vi } from 'vitest'
import { novoExame, validarExame, rascunhoParaExame, dataLocal } from '../features/atendimentos/exameTipos'
import { linhaParaExame, exameParaLinha } from '../services/storage/mapeamentoExame'
import { gerarRelatorioAtendimento } from '../features/atendimentos/relatorioAtendimento'
import { ATENDIMENTO_VAZIO } from '../features/atendimentos/atendimentoTipos'

describe('Solicitação e resultado de exames', () => {
  it('permite solicitar sem resultado e acompanha todos os estados', () => {
    const rascunho = novoExame('Exame manual', 'outro')
    for (const status of ['solicitado', 'agendado', 'coletado', 'aguardando_resultado', 'cancelado'] as const)
      expect(validarExame({ ...rascunho, status })).toBe('')
    expect(exameParaLinha(rascunhoParaExame(rascunho))).toMatchObject({
      nome_exame: 'Exame manual',
      status: 'solicitado',
      data_realizacao: null,
      resultado: '',
    })
  })
  it('exige resultado e realização ao concluir e valida a ordem das datas', () => {
    const rascunho = novoExame('Hemograma', 'laboratorial')
    expect(validarExame({ ...rascunho, status: 'concluido' })).not.toBe('')
    expect(validarExame({ ...rascunho, status: 'concluido', resultado: 'Teste', dataRealizacao: dataLocal() })).toBe('')
    expect(validarExame({ ...rascunho, dataRealizacao: '2000-01-01' })).not.toBe('')
    expect(validarExame({ ...rascunho, dataSolicitacao: '2025-02-30' })).not.toBe('')
    expect(validarExame({ ...rascunho, dataRealizacao: '2999-01-01' })).not.toBe('')
    expect(validarExame({ ...rascunho, nome: ' ' })).not.toBe('')
  })
  it('mantém compatibilidade com exames anteriores à migração', () => {
    const legado = linhaParaExame({
      id: 1,
      consulta_id: 2,
      nome_exame: 'Antigo',
      data_exame: '2025-01-15T12:00:00Z',
      resultado: 'Resultado antigo',
    })
    expect(legado.status).toBe('concluido')
    expect(legado.dataRealizacao).not.toBeNull()
    expect(legado.resultado).toBe('Resultado antigo')
    expect(legado.categoria).toBe('outro')
    expect(
      linhaParaExame({ id: 2, nome_exame: 'Pendente', data_exame: '2025-01-15T12:00:00Z', resultado: null }).status,
    ).toBe('solicitado')
  })
  it('inclui solicitações e resultados no relatório e escapa conteúdo digitado', () => {
    const write = vi.fn()
    vi.stubGlobal('window', { open: () => ({ document: { open: vi.fn(), write, close: vi.fn() } }) })
    try {
      gerarRelatorioAtendimento(ATENDIMENTO_VAZIO, [
        {
          ...novoExame('<script>teste</script>', 'outro'),
          interpretacao: '<img src=x>',
          laudo: '<script>laudo</script>',
          laudoAnexo: {
            nome: '<img src=x>.pdf',
            tipo: 'application/pdf',
            dados: 'data:application/pdf;base64,JVBERi0=',
          },
        },
      ])
      const html = write.mock.calls[0][0]
      expect(html).toContain('Exames complementares')
      expect(html).toContain('Aguardando resultado')
      expect(html).toContain('&lt;script&gt;')
      expect(html).toContain('Laudo: &lt;script&gt;laudo&lt;/script&gt;')
      expect(html).toContain('Anexo do laudo: &lt;img src=x&gt;.pdf')
      expect(html).not.toContain('<img src=x>')
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
