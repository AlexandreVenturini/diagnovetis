import { describe, expect, it } from 'vitest'
import {
  agruparResultados,
  buscarComMotivo,
  buscarExames,
  CATALOGO_EXAMES,
  camposDoModelo,
  modeloDoExame,
  resumirResultado,
  situacaoValor,
  textoReferencia,
  validarDados,
} from '../features/atendimentos/catalogoExames'
import { exameDoModelo, exameParaRascunho, rascunhoParaExame, validarExame } from '../features/atendimentos/exameTipos'
import { exameParaLinha, linhaParaExame } from '../services/storage/mapeamentoExame'

const hemograma = modeloDoExame('hemograma')!

describe('Catálogo de exames complementares', () => {
  it('tem ids, nomes e chaves de campo únicos', () => {
    expect(new Set(CATALOGO_EXAMES.map((modelo) => modelo.id)).size).toBe(CATALOGO_EXAMES.length)
    expect(new Set(CATALOGO_EXAMES.map((modelo) => modelo.nome)).size).toBe(CATALOGO_EXAMES.length)
    for (const modelo of CATALOGO_EXAMES) {
      const chaves = camposDoModelo(modelo).map((campo) => campo.chave)
      expect(new Set(chaves).size, modelo.id).toBe(chaves.length)
    }
  })
  it('mantém os exames que já existiam e reconhece exames antigos pelo nome', () => {
    for (const nome of [
      'Hemograma',
      'Bioquímica sérica',
      'Urinálise',
      'Exame de fezes',
      'Citologia',
      'Sorologia',
      'PCR',
    ])
      expect(modeloDoExame(null, nome)?.nome).toBe(nome)
    expect(modeloDoExame(null, 'radiografia')?.id).toBe('radiografia')
    expect(modeloDoExame(null, 'Exame qualquer')).toBeUndefined()
  })
  it('busca por nome, sigla e agente ignorando acentos', () => {
    expect(buscarExames('4dx').map((modelo) => modelo.id)).toEqual(['teste_4dx'])
    expect(buscarExames('raio-x').map((modelo) => modelo.id)).toContain('radiografia')
    expect(buscarExames('urinalise').map((modelo) => modelo.id)).toContain('urinalise')
    expect(buscarExames('ehrlichia').map((modelo) => modelo.id)).toEqual(
      expect.arrayContaining(['teste_4dx', 'hemoparasitas']),
    )
    expect(buscarExames('', 'imagem').every((modelo) => modelo.grupo === 'imagem')).toBe(true)
  })
  it('busca pelo começo das palavras, ordena pelo nome e diz por qual termo achou', () => {
    const ids = buscarExames('ur').map((modelo) => modelo.id)
    expect(ids[0]).toBe('urinalise')
    expect(ids).toEqual(expect.arrayContaining(['bioquimica', 'fezes']))
    expect(ids).not.toEqual(expect.arrayContaining(['coagulograma']))
    expect(buscarComMotivo('ur').find((item) => item.modelo.id === 'cultura_antibiograma')?.motivo).toBe('urocultura')
    expect(ids).not.toContain('radiografia')
    expect(buscarComMotivo('ureia')).toEqual([{ modelo: modeloDoExame('bioquimica'), motivo: 'ureia' }])
    expect(buscarComMotivo('teste cino').map((item) => item.modelo.id)).toEqual(['teste_cinomose'])
    expect(agruparResultados(buscarComMotivo('teste rapido')).map((secao) => secao.grupo)).toEqual(['infecciosas'])
  })
  it('marca valores fora da referência', () => {
    const hematocrito = camposDoModelo(hemograma).find((campo) => campo.chave === 'hematocrito')!
    expect(textoReferencia(hematocrito)).toBe('37 – 55')
    expect(situacaoValor(hematocrito, '30')).toBe('abaixo')
    expect(situacaoValor(hematocrito, '60')).toBe('acima')
    expect(situacaoValor(hematocrito, '45')).toBe('')
    expect(situacaoValor(hematocrito, '')).toBe('')
    const aeAo = camposDoModelo(modeloDoExame('ecocardiograma')!).find((campo) => campo.chave === 'ae_ao')!
    expect(textoReferencia(aeAo)).toBe('até 1,6')
  })
  it('gera o resumo com os achados e os valores alterados', () => {
    expect(resumirResultado(hemograma, { hematocrito: '30', leucocitos: '10' })).toBe(
      'Hematócrito 30 % (abaixo da referência)',
    )
    expect(resumirResultado(hemograma, { hematocrito: '45' })).toBe('Valores dentro da referência.')
    expect(resumirResultado(modeloDoExame('teste_4dx'), { ehrlichia: 'Reagente' })).toBe('Ehrlichia spp.: Reagente')
    expect(resumirResultado(undefined, {})).toBe('')
  })
  it('recusa número inválido e opção fora da lista', () => {
    expect(validarDados(hemograma, { hematocrito: 'abc' })).toContain('Hematócrito')
    expect(validarDados(modeloDoExame('teste_cinomose'), { resultado: 'Talvez' })).toContain('Resultado')
    const exame = exameDoModelo(hemograma)
    expect(validarExame({ ...exame, dados: { hemoglobina: 'x' } })).toContain('Hemograma')
    expect(validarExame({ ...exame, dados: { hemoglobina: '13.5' } })).toBe('')
  })
  it('grava modelo e campos preenchidos e lê de volta do banco', () => {
    const rascunho = {
      ...exameDoModelo(modeloDoExame('raspado_cutaneo')!),
      dados: { local: ' Orelha ', resultado: 'Positivo', achados: ['Demodex spp.', 'Inventado'], profundidade: '' },
    }
    const linha = exameParaLinha(rascunhoParaExame(rascunho))
    expect(linha).toMatchObject({
      modelo: 'raspado_cutaneo',
      dados_especificos: { local: 'Orelha', resultado: 'Positivo', achados: ['Demodex spp.'] },
    })
    expect(linha.dados_especificos).not.toHaveProperty('profundidade')
    const lido = exameParaRascunho(linhaParaExame({ ...linha, id: 9, resultado: '' }))
    expect(lido.modelo).toBe('raspado_cutaneo')
    expect(lido.dados.achados).toEqual(['Demodex spp.'])
    expect(linhaParaExame({ id: 1, nome_exame: 'Antigo', data_exame: '2025-01-15', resultado: null }).dados).toEqual({})
  })
})
