import { describe, expect, it } from 'vitest'
import { DADOS_CLINICOS_VAZIOS } from '../features/condicoes/condicaoTipos'
import { FILTROS_VAZIOS, filtrarCondicoes } from '../features/condicoes/catalogoClinico'
import { zoonoseParaCondicao } from '../features/condicoes/useCondicoes'
import { Zoonose } from '../models/Zoonose'
import { ZoonoseService } from '../services/ZoonoseService'

const item = (id: number, nome: string, ehZoonose: boolean) => {
  const condicao = new Zoonose(id, nome, 'Agente teste', 'Sinal clínico teste', 'Prevenção teste', 'alto')
  condicao.dadosClinicos = {
    ...structuredClone(DADOS_CLINICOS_VAZIOS),
    ehZoonose,
    categoria: 'Infecciosas',
    sistemas: ['Renal'],
    etiologia: 'Bacteriana',
    faixasEtarias: ['Adulto'],
    transmissao: 'Transmissão cadastrada',
    examesSugeridos: ['Exame cadastrado'],
    diferenciais: ['Diferencial cadastrado'],
    protocolos: ['Conduta cadastrada'],
  }
  return condicao
}

describe('Catálogo de condições clínicas', () => {
  it('preserva campos clínicos após salvar e recarregar', async () => {
    const servico = new ZoonoseService()
    const condicao = item(1, 'Condição teste', false)
    await servico.adicionarZoonose(condicao)
    const [salvo] = await servico.listarZoonoses()
    expect(salvo.dadosClinicos).toEqual(condicao.dadosClinicos)
    expect(zoonoseParaCondicao(salvo).transmissao).toBe('Transmissão cadastrada')
    expect(zoonoseParaCondicao(salvo).examesSugeridos).toEqual(['Exame cadastrado'])
  })
  it('carrega registros antigos sem inventar sistemas ou protocolos', () => {
    const legado = zoonoseParaCondicao(new Zoonose(1, 'Antiga', 'Agente', 'Sinal', 'Prevenção', 'alto'))
    expect(legado.dadosClinicos.ehZoonose).toBe(true)
    expect(legado.dadosClinicos.sistemas).toEqual([])
    expect(legado.dadosClinicos.protocolos).toEqual([])
  })
  it('combina filtros e encontra sinais clínicos sem exigir acentos', () => {
    const linhas = [zoonoseParaCondicao(item(1, 'Beta', true)), zoonoseParaCondicao(item(2, 'Alfa', false))]
    expect(
      filtrarCondicoes(linhas, {
        ...FILTROS_VAZIOS,
        busca: 'clinico',
        categoria: 'Infecciosas',
        sistema: 'Renal',
        etiologia: 'Bacteriana',
        idade: 'Adulto',
        condicao: 'no',
      }).map((linha) => linha.nome),
    ).toEqual(['Alfa'])
    expect(filtrarCondicoes(linhas, { ...FILTROS_VAZIOS, sistema: 'Respiratório' })).toHaveLength(0)
    expect(filtrarCondicoes(linhas, { ...FILTROS_VAZIOS, busca: 'agente' })).toHaveLength(2)
  })
  it('ordena sem alterar os registros originais', () => {
    const linhas = [zoonoseParaCondicao(item(1, 'Beta', true)), zoonoseParaCondicao(item(2, 'Alfa', false))]
    expect(filtrarCondicoes(linhas, FILTROS_VAZIOS).map((linha) => linha.nome)).toEqual(['Alfa', 'Beta'])
    expect(filtrarCondicoes(linhas, { ...FILTROS_VAZIOS, ordem: 'za' }).map((linha) => linha.nome)).toEqual([
      'Beta',
      'Alfa',
    ])
    expect(linhas[0].nome).toBe('Beta')
  })
})
