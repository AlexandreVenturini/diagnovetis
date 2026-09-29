import { describe, it, expect } from 'vitest'
import { ValidacaoError } from '../services/validation/ValidacaoError'
import {
  validarObrigatorio,
  validarEmail,
  validarTelefone,
  validarCep,
  validarData,
  validarDataFutura,
  validarPositivo,
  validarGrauRisco,
  validarIdUnico,
} from '../services/validation/validadores'

describe('validarObrigatorio', () => {
  it('não lança erro para valor preenchido', () => {
    expect(() => validarObrigatorio('João', 'nome')).not.toThrow()
  })

  it('lança ValidacaoError para string vazia', () => {
    expect(() => validarObrigatorio('', 'nome')).toThrow(ValidacaoError)
  })

  it('lança ValidacaoError para string com apenas espaços', () => {
    expect(() => validarObrigatorio('   ', 'nome')).toThrow(ValidacaoError)
  })

  it('informa o campo correto no erro', () => {
    try {
      validarObrigatorio('', 'nome')
    } catch (e) {
      expect(e).toBeInstanceOf(ValidacaoError)
      expect((e as ValidacaoError).campo).toBe('nome')
    }
  })
})

describe('validarEmail', () => {
  it('aceita e-mail válido', () => {
    expect(() => validarEmail('teste@email.com')).not.toThrow()
  })

  it('rejeita e-mail sem @', () => {
    expect(() => validarEmail('teste.email.com')).toThrow(ValidacaoError)
  })

  it('rejeita e-mail sem domínio', () => {
    expect(() => validarEmail('teste@')).toThrow(ValidacaoError)
  })

  it('rejeita string vazia', () => {
    expect(() => validarEmail('')).toThrow(ValidacaoError)
  })
})

describe('validarTelefone', () => {
  it('aceita telefone com 10 dígitos', () => {
    expect(() => validarTelefone('2733001234')).not.toThrow()
  })

  it('aceita telefone com 11 dígitos', () => {
    expect(() => validarTelefone('27933001234')).not.toThrow()
  })

  it('aceita telefone formatado com máscara', () => {
    expect(() => validarTelefone('(27) 93300-1234')).not.toThrow()
  })

  it('rejeita telefone com menos de 10 dígitos', () => {
    expect(() => validarTelefone('123456789')).toThrow(ValidacaoError)
  })

  it('rejeita string vazia', () => {
    expect(() => validarTelefone('')).toThrow(ValidacaoError)
  })
})

describe('validarCep', () => {
  it('aceita CEP com 8 dígitos', () => {
    expect(() => validarCep('29101020')).not.toThrow()
  })

  it('aceita CEP formatado com traço', () => {
    expect(() => validarCep('29101-020')).not.toThrow()
  })

  it('rejeita CEP com menos de 8 dígitos', () => {
    expect(() => validarCep('2910102')).toThrow(ValidacaoError)
  })

  it('rejeita string vazia', () => {
    expect(() => validarCep('')).toThrow(ValidacaoError)
  })
})

describe('validarData', () => {
  it('aceita Date válida', () => {
    expect(() => validarData(new Date())).not.toThrow()
  })

  it('rejeita Date inválida', () => {
    expect(() => validarData(new Date('invalida'))).toThrow(ValidacaoError)
  })
})

describe('validarDataFutura', () => {
  it('aceita data futura', () => {
    const amanha = new Date()
    amanha.setDate(amanha.getDate() + 1)
    expect(() => validarDataFutura(amanha)).not.toThrow()
  })

  it('aceita a data de hoje', () => {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    expect(() => validarDataFutura(hoje)).not.toThrow()
  })

  it('rejeita data passada', () => {
    const ontem = new Date()
    ontem.setDate(ontem.getDate() - 1)
    expect(() => validarDataFutura(ontem)).toThrow(ValidacaoError)
  })
})

describe('validarPositivo', () => {
  it('aceita número positivo', () => {
    expect(() => validarPositivo(1, 'valor')).not.toThrow()
  })

  it('rejeita zero', () => {
    expect(() => validarPositivo(0, 'valor')).toThrow(ValidacaoError)
  })

  it('rejeita negativo', () => {
    expect(() => validarPositivo(-1, 'valor')).toThrow(ValidacaoError)
  })
})

describe('validarGrauRisco', () => {
  it('aceita "baixo"', () => {
    expect(() => validarGrauRisco('baixo')).not.toThrow()
  })

  it('aceita "medio"', () => {
    expect(() => validarGrauRisco('medio')).not.toThrow()
  })

  it('aceita "alto"', () => {
    expect(() => validarGrauRisco('alto')).not.toThrow()
  })

  it('rejeita valor inválido', () => {
    expect(() => validarGrauRisco('crítico')).toThrow(ValidacaoError)
  })

  it('rejeita string vazia', () => {
    expect(() => validarGrauRisco('')).toThrow(ValidacaoError)
  })
})

describe('validarIdUnico', () => {
  const existentes = [{ id: 1 }, { id: 2 }, { id: 3 }]

  it('não lança erro para id inexistente', () => {
    expect(() => validarIdUnico(4, existentes, 'entidade')).not.toThrow()
  })

  it('lança erro para id duplicado', () => {
    expect(() => validarIdUnico(1, existentes, 'entidade')).toThrow(ValidacaoError)
  })

  it('informa o campo "id" no erro', () => {
    try {
      validarIdUnico(2, existentes, 'médico')
    } catch (e) {
      expect((e as ValidacaoError).campo).toBe('id')
    }
  })
})
