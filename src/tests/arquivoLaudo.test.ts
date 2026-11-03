import { describe, expect, it } from 'vitest'
import { TAMANHO_MAXIMO_LAUDO, lerArquivoLaudo, validarAnexoLaudo } from '../features/atendimentos/arquivoLaudo'
import { novoExame, validarExame } from '../features/atendimentos/exameTipos'

describe('Anexos de laudos', () => {
  it('preserva nome e conteúdo do PDF', async () => {
    const resultado = await lerArquivoLaudo(new File(['%PDF-1.7\nlaudo'], 'laudo.pdf', { type: 'application/pdf' }))
    expect(resultado.nome).toBe('laudo.pdf')
    expect(atob(resultado.dados.split(',')[1])).toBe('%PDF-1.7\nlaudo')
    expect(validarAnexoLaudo(resultado)).toBe('')
  })
  it('recusa JPG e PNG para não ocupar espaço no banco', async () => {
    for (const [tipo, bytes] of [
      ['image/jpeg', [255, 216, 255]],
      ['image/png', [137, 80, 78, 71, 13, 10, 26, 10]],
    ] as const) {
      await expect(lerArquivoLaudo(new File([new Uint8Array(bytes)], 'imagem', { type: tipo }))).rejects.toThrow('PDF')
    }
    expect(
      validarAnexoLaudo({ nome: 'foto.png', tipo: 'image/png', dados: 'data:image/png;base64,iVBORw0KGgo=' }),
    ).toContain('PDF')
  })
  it('rejeita conteúdo incompatível, arquivo vazio, tipo não permitido e arquivo grande', async () => {
    for (const arquivo of [
      new File(['texto'], 'falso.pdf', { type: 'application/pdf' }),
      new File([], 'vazio.pdf', { type: 'application/pdf' }),
      new File(['<svg/>'], 'laudo.svg', { type: 'image/svg+xml' }),
      new File([new Uint8Array(TAMANHO_MAXIMO_LAUDO + 1)], 'grande.pdf', { type: 'application/pdf' }),
    ]) {
      await expect(lerArquivoLaudo(arquivo)).rejects.toThrow()
    }
  })
  it('impede salvar durante a leitura ou com URL inválida', () => {
    const exame = novoExame('Hemograma', 'laboratorial')
    expect(validarExame({ ...exame, laudoCarregando: true })).toContain('Aguarde')
    expect(
      validarExame({
        ...exame,
        laudoAnexo: { nome: 'laudo.pdf', tipo: 'application/pdf', dados: 'javascript:alert(1)' },
      }),
    ).not.toBe('')
  })
})
