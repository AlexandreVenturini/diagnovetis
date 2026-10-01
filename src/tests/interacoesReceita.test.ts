import { describe, expect, it } from 'vitest'
import { aplicarDoseNaReceita } from '../features/receitas/nova/aplicarDose'
import { filtrarPets } from '../features/receitas/nova/filtrarPets'
import { receitaVazia, itemReceitaVazio } from '../features/receitas/receita'

const receita = {
  ...receitaVazia(),
  itens: [
    { ...itemReceitaVazio(), medicamento: 'Primeiro', dose: 'Manter' },
    { ...itemReceitaVazio(), medicamento: 'Segundo' },
  ],
}
describe('Aplicar dose no receituário', () => {
  it('preenche somente a dose do medicamento selecionado, aceitando vírgula decimal', () => {
    const resultado = aplicarDoseNaReceita(receita, 1, '2,5', '3', '5')
    expect(resultado.erro).toBe('')
    expect(resultado.receita.itens[1].dose).toBe('1,5 mL (7,5 mg) por administração')
    expect(resultado.receita.itens[0].dose).toBe('Manter')
    expect(receita.itens[1].dose).toBe('')
  })
  it('informa os campos ausentes sem alterar a receita', () => {
    const resultado = aplicarDoseNaReceita(receitaVazia(), 0, '', '', '')
    expect(resultado.erro).toContain('medicamento')
    expect(resultado.erro).toContain('peso')
    expect(resultado.erro).toContain('mg/kg')
    expect(resultado.erro).toContain('mg/mL')
    expect(resultado.receita.itens[0].dose).toBe('')
  })
  it('recusa concentração zero e índice removido', () => {
    expect(aplicarDoseNaReceita(receita, 1, '10', '1', '0').erro).not.toBe('')
    expect(aplicarDoseNaReceita(receita, 99, '10', '1', '1').erro).not.toBe('')
  })
})
describe('Busca de animais', () => {
  const pets = [
    { id: 12, nome: 'Belinha', tutor: 'Márcia', raca: '', idade: '', sexo: '', peso: '', contato: '', historico: '' },
    { id: 13, nome: 'Belinha', tutor: 'João', raca: '', idade: '', sexo: '', peso: '', contato: '', historico: '' },
  ]
  it('não mostra a lista sem busca e encontra por tutor sem acento e identificação', () => {
    expect(filtrarPets(pets, '')).toEqual([])
    expect(filtrarPets(pets, '   ')).toEqual([])
    expect(filtrarPets(pets, 'marcia').map((pet) => pet.id)).toEqual([12])
    expect(filtrarPets(pets, '#13').map((pet) => pet.id)).toEqual([13])
    expect(filtrarPets(pets, 'beli')).toHaveLength(2)
    expect(filtrarPets(pets, 'inexistente')).toEqual([])
  })
})
