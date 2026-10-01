import type { ObitoDados } from '../../supervisao/supervisaoTipos'
import type { RegistroObito } from './obitoTipos'

export const DESTINOS_CORPO = [
  'Cremação',
  'Sepultamento',
  'Encaminhado para necropsia',
  'Encaminhado para ensino/pesquisa',
  'Devolvido ao responsável',
  'Recolhimento por empresa especializada',
]

const CAMPOS: Record<string, string> = {
  data_hora: 'Data e hora',
  circunstancias: 'Circunstâncias',
  causa_provavel: 'Causa provável',
  houve_reanimacao: 'Houve reanimação',
  eutanasia: 'Eutanásia',
  medico_responsavel_nome: 'Profissional responsável',
  comunicado_responsavel: 'Responsável comunicado',
  comunicacao_detalhes: 'Detalhes da comunicação',
  necropsia: 'Necropsia',
  destino_corpo: 'Destinação do corpo',
}

export function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function formatarValor(campo: string, valor: unknown) {
  if (valor === null || valor === undefined || valor === '') return '—'
  if (typeof valor === 'boolean') return valor ? 'Sim' : 'Não'
  if (campo === 'data_hora') return formatarDataHora(String(valor))
  return String(valor)
}

export function obitoParaDados(obito: RegistroObito): ObitoDados {
  return {
    data_hora: obito.dataHora,
    circunstancias: obito.circunstancias,
    causa_provavel: obito.causaProvavel,
    houve_reanimacao: obito.houveReanimacao,
    eutanasia: obito.eutanasia,
    medico_responsavel_id: obito.medicoResponsavelId ?? 0,
    comunicado_responsavel: obito.comunicadoResponsavel,
    comunicacao_detalhes: obito.comunicacaoDetalhes,
    necropsia: obito.necropsia,
    destino_corpo: obito.destinoCorpo,
    consulta_id: obito.consultaId,
  }
}

export function compararObito(antes: Record<string, unknown>, depois: Record<string, unknown>) {
  return Object.entries(CAMPOS)
    .filter(([campo]) => formatarValor(campo, antes[campo]) !== formatarValor(campo, depois[campo]))
    .map(([campo, rotulo]) => ({
      rotulo,
      antes: formatarValor(campo, antes[campo]),
      depois: formatarValor(campo, depois[campo]),
    }))
}

export const novoObito = (): ObitoDados => ({
  data_hora: new Date().toISOString(),
  circunstancias: '',
  causa_provavel: '',
  houve_reanimacao: false,
  eutanasia: false,
  medico_responsavel_id: 0,
  comunicado_responsavel: false,
  comunicacao_detalhes: '',
  necropsia: false,
  destino_corpo: '',
  consulta_id: null,
})

export function validarObito(dados: ObitoDados, retificando: boolean, motivo: string): string {
  if (!dados.data_hora) return 'Informe a data e a hora do óbito.'
  if (new Date(dados.data_hora).getTime() > Date.now() + 5 * 60_000) return 'A data do óbito não pode estar no futuro.'
  if (!dados.circunstancias.trim()) return 'Descreva as circunstâncias do óbito.'
  if (!dados.medico_responsavel_id) return 'Selecione o profissional responsável.'
  if (!dados.destino_corpo.trim()) return 'Informe a destinação do corpo.'
  if (retificando && !motivo.trim()) return 'Informe o motivo da retificação.'
  return ''
}

export function paraCampoLocal(iso: string) {
  const data = new Date(iso)
  return new Date(data.getTime() - data.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}
