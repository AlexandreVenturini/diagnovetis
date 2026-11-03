import { describe, expect, it } from 'vitest'
import { formatarIdadePet, interpretarIdadePet, serializarIdadePet } from '../features/pets/idadePet'

const MENSAGEM_ERRO = 'Informe a idade em anos inteiros e meses de 0 a 11.'

describe('serializarIdadePet - Funcional: classes de equivalência', () => {
  it.each([
    ['CE1 anos válidos e meses válidos', '3', '5', '3 anos e 5 meses'],
    ['CE2 somente anos preenchido', '7', '', '7 anos'],
    ['CE3 somente meses preenchido', '', '4', '4 meses'],
  ])('%s', (_caso, anos, meses, esperado) => {
    expect(serializarIdadePet(anos, meses)).toBe(esperado)
  })

  it.each([
    ['CE4 anos e meses vazios', '', ''],
    ['CE5 anos negativo', '-3', '2'],
    ['CE6 anos fracionário', '2.5', '0'],
    ['CE7 anos não numérico', 'dois', '0'],
    ['CE8 meses negativo', '1', '-4'],
    ['CE9 meses acima de 11', '1', '15'],
    ['CE10 meses fracionário', '1', '3.5'],
    ['CE11 meses não numérico', '1', 'seis'],
  ])('%s é rejeitado', (_caso, anos, meses) => {
    expect(() => serializarIdadePet(anos, meses)).toThrow(MENSAGEM_ERRO)
  })
})

describe('serializarIdadePet - Funcional: análise de valor limite', () => {
  it.each([
    ['meses = -1', '0', '-1'],
    ['meses = 12', '0', '12'],
    ['anos = -1', '-1', '0'],
    ['anos acima do maior inteiro seguro', '9007199254740992', '0'],
  ])('rejeita %s', (_caso, anos, meses) => {
    expect(() => serializarIdadePet(anos, meses)).toThrow(MENSAGEM_ERRO)
  })

  it.each([
    ['meses = 0 com anos = 1', '1', '0', '1 ano'],
    ['meses = 1', '0', '1', '1 mês'],
    ['meses = 10', '0', '10', '10 meses'],
    ['meses = 11', '0', '11', '11 meses'],
    ['anos = 0 e meses = 0', '0', '0', '0 meses'],
    ['anos = 1', '1', '2', '1 ano e 2 meses'],
    ['anos = 2', '2', '0', '2 anos'],
    ['anos no maior inteiro seguro', '9007199254740991', '0', '9007199254740991 anos'],
  ])('aceita %s', (_caso, anos, meses, esperado) => {
    expect(serializarIdadePet(anos, meses)).toBe(esperado)
  })
})

describe('serializarIdadePet - Estrutural: todos os nós', () => {
  it('caminho 1, 2A, 2B, 3: lança erro quando os dois campos estão vazios', () => {
    expect(() => serializarIdadePet('', '')).toThrow(MENSAGEM_ERRO)
  })

  it('caminho 1, 2A, 2B, 3: campos só com espaços contam como vazios', () => {
    expect(() => serializarIdadePet('   ', '')).toThrow(MENSAGEM_ERRO)
    expect(() => serializarIdadePet('', '   ')).toThrow(MENSAGEM_ERRO)
  })

  it('caminho que passa pelos nós 6 (ano no singular) e 11 (mês no singular)', () => {
    expect(serializarIdadePet('1', '1')).toBe('1 ano e 1 mês')
  })

  it('caminho que passa pelos nós 7 (anos no plural) e 12 (meses no plural)', () => {
    expect(serializarIdadePet('2', '3')).toBe('2 anos e 3 meses')
  })

  it('caminho que passa pelo nó 9B: anos sem meses', () => {
    expect(serializarIdadePet('4', '0')).toBe('4 anos')
  })
})

describe('serializarIdadePet - Estrutural: todas as arestas', () => {
  it('2A falso: anos preenchido, meses vazio', () => {
    expect(serializarIdadePet('5', '')).toBe('5 anos')
  })

  it('2A verdadeiro e 2B falso: anos vazio, meses preenchido', () => {
    expect(serializarIdadePet('', '6')).toBe('6 meses')
  })

  it('2C verdadeiro: anos não é inteiro', () => {
    expect(() => serializarIdadePet('1.5', '0')).toThrow(MENSAGEM_ERRO)
  })

  it('2D verdadeiro: anos negativo', () => {
    expect(() => serializarIdadePet('-1', '0')).toThrow(MENSAGEM_ERRO)
  })

  it('2E verdadeiro: meses não é inteiro', () => {
    expect(() => serializarIdadePet('0', '1.5')).toThrow(MENSAGEM_ERRO)
  })

  it('2F verdadeiro: meses negativo', () => {
    expect(() => serializarIdadePet('0', '-1')).toThrow(MENSAGEM_ERRO)
  })

  it('2G verdadeiro: meses maior que 11', () => {
    expect(() => serializarIdadePet('0', '12')).toThrow(MENSAGEM_ERRO)
  })

  it('4 falso, 9A falso, 9B verdadeiro: zero anos e zero meses', () => {
    expect(serializarIdadePet('0', '0')).toBe('0 meses')
  })

  it('4 verdadeiro, 9A falso, 9B falso: só anos, sem meses', () => {
    expect(serializarIdadePet('4', '0')).toBe('4 anos')
  })

  it('4 falso, 9A verdadeiro: só meses', () => {
    expect(serializarIdadePet('0', '6')).toBe('6 meses')
  })
})

describe('interpretarIdadePet e formatarIdadePet - Estrutural: todas as arestas', () => {
  it('texto vazio ou só com espaços', () => {
    expect(interpretarIdadePet('   ')).toEqual({ anos: '', meses: '' })
    expect(formatarIdadePet('   ')).toBe('Não informada')
  })

  it('cadastro antigo com apenas o número de anos', () => {
    expect(interpretarIdadePet(' 3 ')).toEqual({ anos: '3', meses: '0' })
    expect(formatarIdadePet('3')).toBe('3 anos')
    expect(formatarIdadePet('1')).toBe('1 ano')
  })

  it('cadastro antigo com número de anos de dois dígitos', () => {
    expect(interpretarIdadePet('12')).toEqual({ anos: '12', meses: '0' })
    expect(formatarIdadePet('12')).toBe('12 anos')
  })

  it('texto com anos e meses', () => {
    expect(interpretarIdadePet('2 anos e 3 meses')).toEqual({ anos: '2', meses: '3' })
    expect(interpretarIdadePet('1 ano e 1 mês')).toEqual({ anos: '1', meses: '1' })
    expect(interpretarIdadePet('10 ANOS e 11 MESES')).toEqual({ anos: '10', meses: '11' })
  })

  it('texto somente com meses ou somente com anos', () => {
    expect(interpretarIdadePet('8 meses')).toEqual({ anos: '0', meses: '8' })
    expect(interpretarIdadePet('4 anos')).toEqual({ anos: '4', meses: '0' })
  })

  it('texto sem número reconhecível', () => {
    expect(interpretarIdadePet('filhote')).toEqual({ anos: '0', meses: '0' })
    expect(interpretarIdadePet('idade 7')).toEqual({ anos: '0', meses: '0' })
    expect(interpretarIdadePet('7 x')).toEqual({ anos: '0', meses: '0' })
    expect(formatarIdadePet('filhote')).toBe('filhote')
    expect(formatarIdadePet('idade 7')).toBe('idade 7')
  })

  it('espaço entre o número e a unidade é opcional', () => {
    expect(interpretarIdadePet('2anos e 5meses')).toEqual({ anos: '2', meses: '5' })
  })

  it('não confunde outras palavras com a unidade de meses', () => {
    expect(interpretarIdadePet('3 mexes')).toEqual({ anos: '0', meses: '0' })
    expect(interpretarIdadePet('3 m')).toEqual({ anos: '0', meses: '0' })
  })
})
