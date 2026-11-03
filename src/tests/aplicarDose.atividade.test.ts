import { describe, expect, it } from 'vitest'
import { aplicarDoseNaReceita, valorDecimal } from '../features/receitas/nova/aplicarDose'
import { calcularDose } from '../features/receitas/nova/calculoDose'
import { itemReceitaVazio, receitaVazia } from '../features/receitas/receita'
import type { Receita } from '../features/receitas/receita'

const FALTA_MEDICAMENTO = 'adicione um medicamento na busca ou preencha o nome na receita'
const FALTA_PESO = 'informe o peso do animal em kg'
const FALTA_DOSE = 'informe a dose em mg/kg por administração'
const FALTA_CONCENTRACAO = 'informe a concentração em mg/mL'
const CALCULO_INVALIDO = 'Os valores informados não permitem um cálculo válido. Confira peso, dose e concentração.'

const erroFaltando = (...itens: string[]) => `Para aplicar a dose: ${itens.join('; ')}.`

function receitaCom(...medicamentos: string[]): Receita {
  return {
    ...receitaVazia(),
    itens: medicamentos.map((medicamento) => ({ ...itemReceitaVazio(), medicamento })),
  }
}

describe('valorDecimal - Funcional: classes de equivalência', () => {
  it.each([
    ['inteiro', '12', 12],
    ['decimal com vírgula', '2,5', 2.5],
    ['decimal com ponto', '0.75', 0.75],
    ['com espaços em volta', ' 3 ', 3],
    ['começando pelo separador', ',5', 0.5],
    ['começando pelo separador com duas casas', ',75', 0.75],
    ['terminando no separador', '5.', 5],
    ['várias casas decimais', '12,375', 12.375],
  ])('aceita número %s', (_caso, texto, esperado) => {
    expect(valorDecimal(texto)).toBe(esperado)
  })

  it.each([
    ['vazio', ''],
    ['texto', 'dez'],
    ['negativo', '-1'],
    ['com unidade', '3 kg'],
    ['notação científica', '1e3'],
    ['dois separadores', '1,2,3'],
    ['só o separador', ','],
  ])('retorna NaN para valor %s', (_caso, texto) => {
    expect(valorDecimal(texto)).toBeNaN()
  })
})

describe('aplicarDoseNaReceita - Funcional: classes de equivalência', () => {
  it('CE1 todos os dados válidos preenchem a dose do medicamento escolhido', () => {
    const receita = receitaCom('Dipirona', 'Meloxicam')
    const resultado = aplicarDoseNaReceita(receita, 1, '10', '0,1', '2')
    expect(resultado.erro).toBe('')
    expect(resultado.dose).toBe('0,5 mL (1 mg) por administração')
    expect(resultado.receita.itens[1].dose).toBe('0,5 mL (1 mg) por administração')
    expect(resultado.receita.itens[0].dose).toBe('')
    expect(receita.itens[1].dose).toBe('')
  })

  it('CE2 medicamento sem nome', () => {
    expect(aplicarDoseNaReceita(receitaCom(''), 0, '10', '1', '2').erro).toBe(erroFaltando(FALTA_MEDICAMENTO))
  })

  it('CE3 peso inválido', () => {
    expect(aplicarDoseNaReceita(receitaCom('Dipirona'), 0, 'abc', '1', '2').erro).toBe(erroFaltando(FALTA_PESO))
  })

  it('CE4 dose mg/kg inválida', () => {
    expect(aplicarDoseNaReceita(receitaCom('Dipirona'), 0, '10', '-2', '2').erro).toBe(erroFaltando(FALTA_DOSE))
  })

  it('CE5 concentração inválida', () => {
    expect(aplicarDoseNaReceita(receitaCom('Dipirona'), 0, '10', '1', '').erro).toBe(erroFaltando(FALTA_CONCENTRACAO))
  })

  it('CE6 todos os campos inválidos são listados juntos e na ordem', () => {
    const resultado = aplicarDoseNaReceita(receitaCom(''), 0, '', '0', 'x')
    expect(resultado.erro).toBe(erroFaltando(FALTA_MEDICAMENTO, FALTA_PESO, FALTA_DOSE, FALTA_CONCENTRACAO))
    expect(resultado.dose).toBeUndefined()
  })
})

describe('aplicarDoseNaReceita - Funcional: análise de valor limite', () => {
  it.each([
    ['peso', '0', '1', '1', FALTA_PESO],
    ['dose', '1', '0', '1', FALTA_DOSE],
    ['concentração', '1', '1', '0', FALTA_CONCENTRACAO],
  ])('%s igual a zero é recusado', (_campo, peso, mgKg, concentracao, mensagem) => {
    expect(aplicarDoseNaReceita(receitaCom('Dipirona'), 0, peso, mgKg, concentracao).erro).toBe(erroFaltando(mensagem))
  })

  it('valores mínimos positivos (0,01) são aceitos', () => {
    const resultado = aplicarDoseNaReceita(receitaCom('Dipirona'), 0, '0,01', '0,01', '0,01')
    expect(resultado.erro).toBe('')
    expect(resultado.dose).toBe('0,01 mL (0,0001 mg) por administração')
  })
})

describe('aplicarDoseNaReceita - Estrutural: todas as arestas', () => {
  it('nó 1 verdadeiro: índice que não existe na receita', () => {
    const receita = receitaCom('Dipirona')
    const resultado = aplicarDoseNaReceita(receita, 5, '10', '1', '2')
    expect(resultado.erro).toBe(erroFaltando(FALTA_MEDICAMENTO))
    expect(resultado.receita).toBe(receita)
  })

  it('nó 1 verdadeiro: nome do medicamento só com espaços', () => {
    expect(aplicarDoseNaReceita(receitaCom('   '), 0, '10', '1', '2').erro).toBe(erroFaltando(FALTA_MEDICAMENTO))
  })

  it('nó 5 verdadeiro: peso e concentração faltando são separados por ponto e vírgula', () => {
    expect(aplicarDoseNaReceita(receitaCom('Dipirona'), 0, '', '1', '').erro).toBe(
      erroFaltando(FALTA_PESO, FALTA_CONCENTRACAO),
    )
  })

  it('nó 5 falso e nó 7 verdadeiro: números válidos mas grandes demais para calcular', () => {
    const receita = receitaCom('Dipirona')
    const resultado = aplicarDoseNaReceita(receita, 0, '9'.repeat(400), '1', '1')
    expect(resultado.erro).toBe(CALCULO_INVALIDO)
    expect(resultado.receita).toBe(receita)
    expect(resultado.dose).toBeUndefined()
  })

  it('nó 7 falso: dose formatada no padrão brasileiro e somente no item escolhido', () => {
    const receita = receitaCom('Amoxicilina', 'Dipirona', 'Omeprazol')
    const resultado = aplicarDoseNaReceita(receita, 1, '12,5', '25', '50')
    expect(resultado.receita.itens.map((item) => item.dose)).toEqual(['', '6,25 mL (312,5 mg) por administração', ''])
    expect(resultado.receita.itens[1].medicamento).toBe('Dipirona')
  })
})

describe('calcularDose - Estrutural: todas as arestas', () => {
  it('nó 1 falso e nó 3 falso: cálculo válido', () => {
    expect(calcularDose(10, 0.1, 2)).toEqual({ mg: 1, ml: 0.5 })
  })

  it('nó 1 verdadeiro: qualquer entrada zero, negativa ou não finita', () => {
    expect(calcularDose(0, 1, 1)).toBeNull()
    expect(calcularDose(1, -1, 1)).toBeNull()
    expect(calcularDose(1, 1, Infinity)).toBeNull()
  })

  it('nó 3 verdadeiro: mg finito, mas mL estoura por concentração muito pequena', () => {
    expect(calcularDose(1, 1, 1e-320)).toBeNull()
  })

  it('nó 3 verdadeiro: mg estoura por peso muito grande', () => {
    expect(calcularDose(Number.MAX_VALUE, 10, 1)).toBeNull()
  })
})
