import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { compararObito, formatValue } from '../features/records/death/deathRules'
import { DogList } from '../features/dogs/DogList'
import type { Dog } from '../features/dogs/dogTypes'

describe('Registro de óbito', () => {
  it('mostra sim/não e traço para campos vazios', () => {
    expect(formatValue('eutanasia', true)).toBe('Sim')
    expect(formatValue('necropsia', false)).toBe('Não')
    expect(formatValue('causa_provavel', '')).toBe('—')
  })

  it('lista só os campos alterados na retificação', () => {
    const antes = { circunstancias: 'Parada na internação', eutanasia: false, destino_corpo: 'Cremação', id: 1 }
    const depois = { circunstancias: 'Parada na internação', eutanasia: true, destino_corpo: 'Sepultamento', id: 1 }
    expect(compararObito(antes, depois)).toEqual([
      { rotulo: 'Eutanásia', antes: 'Não', depois: 'Sim' },
      { rotulo: 'Destinação do corpo', antes: 'Cremação', depois: 'Sepultamento' },
    ])
  })

  it('marca o animal em óbito no cadastro', () => {
    const dog = (id: number, deceasedAt: string): Dog => ({
      id,
      name: `Cão ${id}`,
      breed: 'SRD',
      age: '2 anos',
      weight: '10',
      sex: '',
      tutor: 'Maria',
      contact: '',
      history: '',
      createdAt: '',
      deceasedAt,
    })
    localStorage.setItem('diagnovetis:periodo:cadastro', 'all')
    const html = renderToStaticMarkup(
      <DogList dogs={[dog(1, ''), dog(2, '2026-09-28')]} onCreate={() => {}} onEdit={() => {}} onDetails={() => {}} />,
    )
    expect(html.match(/>Óbito</g)).toHaveLength(1)
  })
})
