import { describe, expect, it } from 'vitest'
import { EMPTY_CONSULTATION } from '../features/consultations/consultationTypes'
import { compararCampos, dataToCampos, splitObservacoes } from '../features/records/retification'

describe('Retificação de atendimentos', () => {
  it('separa queixa e histórico gravados nas observações', () => {
    expect(splitObservacoes('Queixa: Vômito. Não come. Histórico: Vacinado.\nSem viagens')).toEqual({
      mainComplaint: 'Vômito. Não come',
      history: 'Vacinado.\nSem viagens',
    })
    expect(splitObservacoes('Texto livre antigo')).toEqual({ mainComplaint: 'Texto livre antigo', history: '' })
  })

  it('converte os dados da tela nos campos do banco sem transformar vazio em texto', () => {
    const campos = dataToCampos({
      ...EMPTY_CONSULTATION,
      mainComplaint: 'Tosse',
      history: 'Sem histórico',
      temperature: '38,5',
      heartRate: '',
      eyes: '',
      zoonosisSearch: '',
    })
    expect(campos.observacoes).toBe('Queixa: Tosse. Histórico: Sem histórico')
    expect(campos.temperatura).toBe(38.5)
    expect(campos.frequencia_cardiaca).toBeNull()
    expect(campos.olhos).toBeNull()
    expect(campos.diagnostico_zoonose_status).toBe('negativo')
  })

  it('lista apenas os campos alterados entre duas versões', () => {
    const antes = { diagnostico: 'Gastrite', temperatura: 39, olhos: null, pet_id: 1 }
    const depois = { diagnostico: 'Gastroenterite', temperatura: 39, olhos: 'Secreção', pet_id: 2 }
    expect(compararCampos(antes, depois)).toEqual([
      { campo: 'diagnostico', rotulo: 'Diagnóstico', antes: 'Gastrite', depois: 'Gastroenterite' },
      { campo: 'olhos', rotulo: 'Olhos', antes: '', depois: 'Secreção' },
    ])
  })
})
