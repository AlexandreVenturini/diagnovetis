import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { compararObito, formatarValor } from '../features/prontuarios/obito/obitoRegras'
import { ListaPets } from '../features/pets/ListaPets'
import type { PetResumo } from '../features/pets/petTipos'

describe('Registro de óbito', () => {
  it('mostra sim/não e traço para campos vazios', () => {
    expect(formatarValor('eutanasia', true)).toBe('Sim')
    expect(formatarValor('necropsia', false)).toBe('Não')
    expect(formatarValor('causa_provavel', '')).toBe('—')
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
    const pet = (id: number, obitoEm: string): PetResumo => ({
      id,
      nome: `Cão ${id}`,
      raca: 'SRD',
      idade: '2 anos',
      peso: '10',
      sexo: '',
      tutor: 'Maria',
      contato: '',
      historico: '',
      cadastradoEm: '',
      obitoEm,
    })
    localStorage.setItem('diagnovetis:periodo:cadastro', 'tudo')
    const html = renderToStaticMarkup(
      <ListaPets
        pets={[pet(1, ''), pet(2, '2026-09-28')]}
        aoCriar={() => {}}
        aoEditar={() => {}}
        aoDetalhar={() => {}}
      />,
    )
    expect(html.match(/>Óbito</g)).toHaveLength(1)
  })
})
