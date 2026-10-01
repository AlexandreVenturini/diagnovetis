import type { Receita } from '../receita'
import { calcularDose } from './calculoDose'

export function valorDecimal(valor: string) {
  const normalizado = valor.trim().replace(',', '.')
  return /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalizado) ? Number(normalizado) : NaN
}
const formatar = (valor: number) => valor.toLocaleString('pt-BR', { maximumSignificantDigits: 8 })
export function aplicarDoseNaReceita(
  receita: Receita,
  indice: number,
  peso: string,
  mgKg: string,
  concentracao: string,
) {
  const faltando: string[] = []
  if (!receita.itens[indice]?.medicamento.trim())
    faltando.push('adicione um medicamento na busca ou preencha o nome na receita')
  if (!(valorDecimal(peso) > 0)) faltando.push('informe o peso do animal em kg')
  if (!(valorDecimal(mgKg) > 0)) faltando.push('informe a dose em mg/kg por administração')
  if (!(valorDecimal(concentracao) > 0)) faltando.push('informe a concentração em mg/mL')
  if (faltando.length) return { erro: `Para aplicar a dose: ${faltando.join('; ')}.`, receita }
  const calculo = calcularDose(valorDecimal(peso), valorDecimal(mgKg), valorDecimal(concentracao))
  if (!calculo)
    return {
      erro: 'Os valores informados não permitem um cálculo válido. Confira peso, dose e concentração.',
      receita,
    }
  const dose = `${formatar(calculo.ml)} mL (${formatar(calculo.mg)} mg) por administração`
  return {
    erro: '',
    dose,
    receita: {
      ...receita,
      itens: receita.itens.map((item, i) => (i === indice ? { ...item, dose } : item)),
    },
  }
}
