import { Medicamento } from '../../models/Medicamento'
import type { MedicamentoResumo, DadosFormularioMedicamento } from './medicamentoTipos'

export const FORMULARIO_MEDICAMENTO_VAZIO: DadosFormularioMedicamento = {
  nomeComercial: '',
  principioAtivo: '',
  indicacoes: '',
  dosagem: '',
  doseMgKg: 0,
  frequencia: 'SID (uma vez ao dia)',
  via: 'Oral',
  concentracao: '',
  concentracaoMgMl: null,
  contraindicacoes: '',
  observacoes: '',
}

const separarLista = (valor: string) =>
  valor
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

const ehMgPorMl = (unidade: string) => unidade.toLocaleLowerCase('pt-BR').replaceAll(' ', '') === 'mg/ml'

function separarMedida(medida: string) {
  const correspondencia = medida.trim().match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/)
  return {
    valor: correspondencia ? Number(correspondencia[1].replace(',', '.')) : Number.NaN,
    unidade: correspondencia?.[2].trim() ?? '',
  }
}

export function medicamentoParaResumo(medicamento: Medicamento): MedicamentoResumo {
  const valorDosagem = separarMedida(medicamento.tipo).valor
  return {
    id: medicamento.id,
    nomeComercial: medicamento.nome,
    principioAtivo: medicamento.principioAtivo,
    indicacoes: [],
    dosagem: medicamento.tipo,
    doseMgKg: Number.isFinite(valorDosagem) ? valorDosagem : 0,
    frequencia: medicamento.formaFarmaceutica,
    via: medicamento.viaAdministracao,
    concentracao: `${medicamento.concentracao} ${medicamento.unidadeConcentracao}`.trim(),
    concentracaoMgMl: ehMgPorMl(medicamento.unidadeConcentracao) ? medicamento.concentracao : null,
    contraindicacoes: [],
    observacoes: medicamento.descricao,
  }
}

export function montarMedicamento(
  formulario: DadosFormularioMedicamento,
  id: number,
): { erro: string } | { medicamento: Medicamento; resumo: MedicamentoResumo } {
  const interpretado = separarMedida(formulario.concentracao)
  const valor = formulario.concentracaoMgMl ?? interpretado.valor
  const unidade = interpretado.unidade || (formulario.concentracaoMgMl ? 'mg/mL' : '')
  if (!Number.isFinite(valor) || valor <= 0 || !unidade)
    return { erro: 'Informe a concentração com valor e unidade, por exemplo: 30 mg/mL.' }

  const medicamento = new Medicamento(
    id,
    formulario.nomeComercial.trim(),
    formulario.principioAtivo.trim(),
    formulario.observacoes.trim(),
    valor,
    unidade,
    formulario.frequencia.trim(),
    formulario.via.trim(),
    formulario.dosagem.trim(),
  )
  const resumo: MedicamentoResumo = {
    ...formulario,
    id,
    indicacoes: separarLista(formulario.indicacoes),
    contraindicacoes: separarLista(formulario.contraindicacoes),
    concentracao: `${valor} ${unidade}`,
    concentracaoMgMl: ehMgPorMl(unidade) ? valor : null,
  }
  return { medicamento, resumo }
}
