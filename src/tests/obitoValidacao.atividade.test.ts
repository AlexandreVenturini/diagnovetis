import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { validarObito } from '../features/prontuarios/obito/obitoRegras'
import type { ObitoDados } from '../features/supervisao/supervisaoTipos'

const AGORA = new Date('2026-10-29T14:00:00.000Z')
const CINCO_MINUTOS = 5 * 60_000

const MENSAGENS = {
  data: 'Informe a data e a hora do óbito.',
  futuro: 'A data do óbito não pode estar no futuro.',
  circunstancias: 'Descreva as circunstâncias do óbito.',
  profissional: 'Selecione o profissional responsável.',
  destino: 'Informe a destinação do corpo.',
  motivo: 'Informe o motivo da retificação.',
}

function obito(alteracoes: Partial<ObitoDados> = {}): ObitoDados {
  return {
    data_hora: '2026-10-29T10:30:00.000Z',
    circunstancias: 'Parada cardiorrespiratória durante a internação',
    causa_provavel: '',
    houve_reanimacao: true,
    eutanasia: false,
    medico_responsavel_id: 7,
    comunicado_responsavel: false,
    comunicacao_detalhes: '',
    necropsia: false,
    destino_corpo: 'Cremação',
    consulta_id: null,
    ...alteracoes,
  }
}

const emMinutos = (minutos: number) => new Date(AGORA.getTime() + minutos * 60_000).toISOString()

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(AGORA)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('validarObito - Funcional: classes de equivalência', () => {
  it('CE1 registro novo com todos os campos obrigatórios é aceito', () => {
    expect(validarObito(obito(), false, '')).toBe('')
  })

  it('CE2 retificação com motivo é aceita', () => {
    expect(validarObito(obito(), true, 'Horário digitado errado')).toBe('')
  })

  it('CE3 data e hora não informadas', () => {
    expect(validarObito(obito({ data_hora: '' }), false, '')).toBe(MENSAGENS.data)
  })

  it('CE4 data no futuro', () => {
    expect(validarObito(obito({ data_hora: emMinutos(60 * 24) }), false, '')).toBe(MENSAGENS.futuro)
  })

  it('CE5 circunstâncias em branco', () => {
    expect(validarObito(obito({ circunstancias: '' }), false, '')).toBe(MENSAGENS.circunstancias)
  })

  it('CE6 profissional responsável não selecionado', () => {
    expect(validarObito(obito({ medico_responsavel_id: 0 }), false, '')).toBe(MENSAGENS.profissional)
  })

  it('CE7 destinação do corpo não informada', () => {
    expect(validarObito(obito({ destino_corpo: '' }), false, '')).toBe(MENSAGENS.destino)
  })

  it('CE8 retificação sem motivo', () => {
    expect(validarObito(obito(), true, '')).toBe(MENSAGENS.motivo)
  })
})

describe('validarObito - Funcional: análise de valor limite da data (tolerância de 5 minutos)', () => {
  it.each([
    ['1 dia antes de agora', -60 * 24, ''],
    ['exatamente agora', 0, ''],
    ['4 minutos no futuro', 4, ''],
    ['exatamente 5 minutos no futuro', 5, ''],
    ['6 minutos no futuro', 6, MENSAGENS.futuro],
  ])('%s', (_caso, minutos, esperado) => {
    expect(validarObito(obito({ data_hora: emMinutos(minutos) }), false, '')).toBe(esperado)
  })

  it('1 milissegundo além dos 5 minutos é rejeitado', () => {
    const dataHora = new Date(AGORA.getTime() + CINCO_MINUTOS + 1).toISOString()
    expect(validarObito(obito({ data_hora: dataHora }), false, '')).toBe(MENSAGENS.futuro)
  })
})

describe('validarObito - Estrutural: todas as arestas', () => {
  it('nó 1 verdadeiro: sai na primeira verificação mesmo com outros campos inválidos', () => {
    const dados = obito({ data_hora: '', circunstancias: '', medico_responsavel_id: 0, destino_corpo: '' })
    expect(validarObito(dados, true, '')).toBe(MENSAGENS.data)
  })

  it('nó 2 verdadeiro: data futura vem antes da verificação das circunstâncias', () => {
    expect(validarObito(obito({ data_hora: emMinutos(30), circunstancias: '' }), false, '')).toBe(MENSAGENS.futuro)
  })

  it('nó 3 verdadeiro: circunstâncias só com espaços', () => {
    expect(validarObito(obito({ circunstancias: '   ', medico_responsavel_id: 0 }), false, '')).toBe(
      MENSAGENS.circunstancias,
    )
  })

  it('nó 4 verdadeiro: profissional vem antes da destinação', () => {
    expect(validarObito(obito({ medico_responsavel_id: 0, destino_corpo: '' }), false, '')).toBe(MENSAGENS.profissional)
  })

  it('nó 5 verdadeiro: destinação só com espaços', () => {
    expect(validarObito(obito({ destino_corpo: '   ' }), true, '')).toBe(MENSAGENS.destino)
  })

  it('nó 6A falso: registro novo não exige motivo', () => {
    expect(validarObito(obito(), false, '   ')).toBe('')
  })

  it('nó 6A verdadeiro e 6B verdadeiro: retificação com motivo só de espaços', () => {
    expect(validarObito(obito(), true, '   ')).toBe(MENSAGENS.motivo)
  })

  it('nó 6A verdadeiro e 6B falso: retificação com motivo preenchido', () => {
    expect(validarObito(obito(), true, 'Correção da causa provável')).toBe('')
  })
})
