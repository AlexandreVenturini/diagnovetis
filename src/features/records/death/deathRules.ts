import type { ObitoDados } from '../../supervision/supervisionTypes'
import type { DeathRecord } from './deathTypes'

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

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function formatValue(campo: string, value: unknown) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não'
  if (campo === 'data_hora') return formatDateTime(String(value))
  return String(value)
}

export function deathToDados(death: DeathRecord): ObitoDados {
  return {
    data_hora: death.dataHora,
    circunstancias: death.circunstancias,
    causa_provavel: death.causaProvavel,
    houve_reanimacao: death.houveReanimacao,
    eutanasia: death.eutanasia,
    medico_responsavel_id: death.medicoResponsavelId ?? 0,
    comunicado_responsavel: death.comunicadoResponsavel,
    comunicacao_detalhes: death.comunicacaoDetalhes,
    necropsia: death.necropsia,
    destino_corpo: death.destinoCorpo,
    consulta_id: death.consultaId,
  }
}

export function compararObito(antes: Record<string, unknown>, depois: Record<string, unknown>) {
  return Object.entries(CAMPOS)
    .filter(([campo]) => formatValue(campo, antes[campo]) !== formatValue(campo, depois[campo]))
    .map(([campo, rotulo]) => ({
      rotulo,
      antes: formatValue(campo, antes[campo]),
      depois: formatValue(campo, depois[campo]),
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

export function toLocalInput(iso: string) {
  const date = new Date(iso)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}
