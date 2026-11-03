import { describe, expect, it } from 'vitest'
import { ValidacaoError } from '../services/validation/ValidacaoError'
import { validarCep, validarTelefone } from '../services/validation/validadores'

const ERRO_TELEFONE = 'O campo "telefone" deve conter um telefone válido (10 ou 11 dígitos).'
const ERRO_CEP = 'O campo "cep" deve conter 8 dígitos.'

function capturarErro(acao: () => void): ValidacaoError {
  try {
    acao()
  } catch (erro) {
    return erro as ValidacaoError
  }
  throw new Error('Era esperado um erro de validação')
}

describe('validarTelefone - Funcional: classes de equivalência', () => {
  it('CE1 telefone fixo com 10 dígitos é aceito', () => {
    expect(() => validarTelefone('2737221234')).not.toThrow()
  })

  it('CE2 celular com 11 dígitos e máscara é aceito', () => {
    expect(() => validarTelefone('(27) 99876-5432')).not.toThrow()
  })

  it('CE3 telefone vazio é rejeitado como campo obrigatório', () => {
    expect(() => validarTelefone('')).toThrow('O campo "telefone" é obrigatório.')
  })

  it('CE4 telefone com poucos dígitos é rejeitado', () => {
    expect(() => validarTelefone('99876')).toThrow(ERRO_TELEFONE)
  })

  it('CE5 telefone com dígitos demais é rejeitado', () => {
    expect(() => validarTelefone('+55 (27) 99876-5432')).toThrow(ERRO_TELEFONE)
  })

  it('CE6 telefone só com letras é rejeitado', () => {
    expect(() => validarTelefone('telefone fixo')).toThrow(ERRO_TELEFONE)
  })
})

describe('validarTelefone - Funcional: análise de valor limite', () => {
  it.each([
    ['9 dígitos', '273722123', false],
    ['10 dígitos', '2737221234', true],
    ['11 dígitos', '27998765432', true],
    ['12 dígitos', '279987654321', false],
  ])('%s', (_caso, telefone, aceito) => {
    if (aceito) expect(() => validarTelefone(telefone)).not.toThrow()
    else expect(() => validarTelefone(telefone)).toThrow(ERRO_TELEFONE)
  })
})

describe('validarTelefone - Estrutural: todas as arestas', () => {
  it('1 verdadeiro: validarObrigatorio interrompe com o nome do campo padrão', () => {
    const erro = capturarErro(() => validarTelefone('   '))
    expect(erro).toBeInstanceOf(ValidacaoError)
    expect(erro.campo).toBe('telefone')
  })

  it('2A verdadeiro: menos de 10 dígitos depois de remover a máscara', () => {
    const erro = capturarErro(() => validarTelefone('(27) 3722-123'))
    expect(erro.campo).toBe('telefone')
    expect(erro.message).toBe(ERRO_TELEFONE)
  })

  it('2A falso e 2B verdadeiro: mais de 11 dígitos', () => {
    expect(() => validarTelefone('279987654321')).toThrow(ERRO_TELEFONE)
  })

  it('2A falso e 2B falso: telefone válido com máscara', () => {
    expect(() => validarTelefone('(27) 3722-1234')).not.toThrow()
  })

  it('usa o nome de campo informado na mensagem', () => {
    const erro = capturarErro(() => validarTelefone('123', 'contato'))
    expect(erro.campo).toBe('contato')
    expect(erro.message).toBe('O campo "contato" deve conter um telefone válido (10 ou 11 dígitos).')
  })
})

describe('validarCep - Funcional: classes de equivalência', () => {
  it('CE1 CEP com 8 dígitos e traço é aceito', () => {
    expect(() => validarCep('29660-000')).not.toThrow()
  })

  it('CE2 CEP vazio é rejeitado como obrigatório', () => {
    expect(() => validarCep('')).toThrow('O campo "cep" é obrigatório.')
  })

  it('CE3 CEP com menos de 8 dígitos é rejeitado', () => {
    expect(() => validarCep('29660')).toThrow(ERRO_CEP)
  })

  it('CE4 CEP com mais de 8 dígitos é rejeitado', () => {
    expect(() => validarCep('29660-0001')).toThrow(ERRO_CEP)
  })

  it('CE5 CEP só com letras é rejeitado', () => {
    expect(() => validarCep('ABCDE-FGH')).toThrow(ERRO_CEP)
  })
})

describe('validarCep - Funcional: análise de valor limite', () => {
  it.each([
    ['7 dígitos', '2966000', false],
    ['8 dígitos', '29660000', true],
    ['9 dígitos', '296600001', false],
  ])('%s', (_caso, cep, aceito) => {
    if (aceito) expect(() => validarCep(cep)).not.toThrow()
    else expect(() => validarCep(cep)).toThrow(ERRO_CEP)
  })
})

describe('validarCep - Estrutural: todas as arestas', () => {
  it('1 verdadeiro: campo padrão "cep" no erro de obrigatório', () => {
    expect(capturarErro(() => validarCep('  ')).campo).toBe('cep')
  })

  it('2 verdadeiro: quantidade diferente de 8 com o campo informado', () => {
    const erro = capturarErro(() => validarCep('2966-00', 'cepEntrega'))
    expect(erro.campo).toBe('cepEntrega')
    expect(erro.message).toBe('O campo "cepEntrega" deve conter 8 dígitos.')
  })

  it('2 falso: CEP com máscara e espaços é aceito', () => {
    expect(() => validarCep(' 29.660-000 ')).not.toThrow()
  })
})
