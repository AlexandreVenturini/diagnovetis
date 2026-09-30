import type { ObitoDados } from '../../supervision/supervisionTypes'

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
