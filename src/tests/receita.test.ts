import { describe, expect, it, vi } from 'vitest'
import { ATENDIMENTO_VAZIO } from '../features/atendimentos/atendimentoTipos'
import { receitaVazia, gerarReceita, temReceita, htmlReceita, validarReceita } from '../features/receitas/receita'

const paciente = {
  ...ATENDIMENTO_VAZIO,
  nomePet: 'Paciente teste',
  nomeTutor: 'Tutor teste',
  veterinario: 'Profissional teste',
  idade: '2',
  raca: 'Poodle',
}
const receita = {
  crmv: '123 / ES',
  orientacoes: 'Orientação de teste\nSegunda linha',
  itens: [
    {
      medicamento: 'Medicamento de teste',
      dose: 'Dose informada',
      via: 'Via informada',
      frequencia: 'Intervalo informado',
      duracao: 'Duração informada',
      quantidade: 'Quantidade informada',
    },
  ],
}

describe('Receita veterinária', () => {
  it('distingue atendimento sem receita de uma prescrição parcialmente preenchida', () => {
    expect(temReceita(receitaVazia())).toBe(false)
    expect(temReceita({ ...receitaVazia(), orientacoes: 'Orientação' })).toBe(true)
    expect(temReceita(receita)).toBe(true)
  })
  it('exige identificação, CRMV e todos os campos dos medicamentos', () => {
    expect(validarReceita(ATENDIMENTO_VAZIO, receita)).not.toBe('')
    expect(validarReceita(paciente, receitaVazia())).not.toBe('')
    expect(validarReceita(paciente, { ...receita, itens: [] })).not.toBe('')
    for (const key of Object.keys(receita.itens[0])) {
      expect(validarReceita(paciente, { ...receita, itens: [{ ...receita.itens[0], [key]: ' ' }] })).not.toBe('')
    }
    expect(validarReceita(paciente, receita)).toBe('')
  })

  it('gera os dados da receita, unidades de idade e múltiplos medicamentos', () => {
    const html = htmlReceita(
      paciente,
      {
        ...receita,
        itens: [...receita.itens, { ...receita.itens[0], medicamento: 'Outro medicamento' }],
      },
      new Date(2026, 8, 14, 12),
    )
    for (const valor of [
      'Paciente teste',
      'Tutor teste',
      'Profissional teste',
      '2 anos',
      '123 / ES',
      '14/09/2026',
      '2. Outro medicamento',
      ...Object.values(receita.itens[0]),
    ])
      expect(html).toContain(valor)
    expect(html).toContain('@media print')
  })

  it('escapa conteúdo digitado para impedir execução de HTML no documento', () => {
    const html = htmlReceita(
      { ...paciente, nomePet: '<script>alert(1)</script>' },
      { ...receita, orientacoes: '<img src=x onerror=alert(1)>' },
    )
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;script&gt;')
  })

  it('informa quando a janela está bloqueada e escreve o documento quando permitida', () => {
    const popup = { document: { open: vi.fn(), write: vi.fn(), close: vi.fn() } }
    const open = vi.fn().mockReturnValueOnce(null).mockReturnValueOnce(popup)
    vi.stubGlobal('window', { open })
    try {
      expect(gerarReceita(paciente, receita)).toBe(false)
      expect(gerarReceita(paciente, receita)).toBe(true)
      expect(popup.document.write).toHaveBeenCalledWith(expect.stringContaining('Receita veterinária'))
      expect(popup.document.close).toHaveBeenCalled()
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
