import { describe, expect, it } from 'vitest'
import { ATENDIMENTO_VAZIO } from '../features/atendimentos/atendimentoTipos'
import { separarObservacoes } from '../features/atendimentos/consultaParaDados'
import { compararCampos, dadosParaCampos } from '../features/prontuarios/retificacao/retificacaoRegras'

describe('Retificação de atendimentos', () => {
  it('separa queixa e histórico gravados nas observações', () => {
    expect(separarObservacoes('Queixa: Vômito. Não come. Histórico: Vacinado.\nSem viagens')).toEqual({
      queixaPrincipal: 'Vômito. Não come',
      historico: 'Vacinado.\nSem viagens',
    })
    expect(separarObservacoes('Texto livre antigo')).toEqual({ queixaPrincipal: 'Texto livre antigo', historico: '' })
  })

  it('converte os dados da tela nos campos do banco sem transformar vazio em texto', () => {
    const campos = dadosParaCampos({
      ...ATENDIMENTO_VAZIO,
      queixaPrincipal: 'Tosse',
      historico: 'Sem histórico',
      temperatura: '38,5',
      frequenciaCardiaca: '',
      olhos: '',
      suspeitaZoonose: '',
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
