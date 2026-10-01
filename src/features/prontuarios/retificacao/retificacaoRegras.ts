import type { DadosAtendimento } from '../../atendimentos/atendimentoTipos'

export const CAMPOS_RETIFICAVEIS: Record<string, string> = {
  observacoes: 'Queixa e histórico',
  diagnostico: 'Diagnóstico',
  conduta: 'Conduta',
  diagnostico_zoonose_status: 'Zoonose (situação)',
  diagnostico_zoonose_observacoes: 'Zoonose (observações)',
  temperatura: 'Temperatura',
  frequencia_cardiaca: 'Frequência cardíaca',
  frequencia_respiratoria: 'Frequência respiratória',
  tpc: 'TPC',
  mucosas: 'Mucosas',
  hidratacao: 'Hidratação',
  nivel_consciencia: 'Nível de consciência',
  pele_pelagem: 'Pele e pelagem',
  olhos: 'Olhos',
  ouvidos: 'Ouvidos',
  boca_dentes: 'Boca/dentes',
  sistema_respiratorio: 'Sistema respiratório',
  sistema_cardiovascular: 'Sistema cardiovascular',
  sistema_gastrointestinal: 'Sistema gastrointestinal',
  sistema_urinario: 'Sistema urinário',
  sistema_reprodutivo: 'Sistema reprodutivo',
  sistema_neurologico: 'Sistema neurológico',
  dor: 'Dor',
  alta_data: 'Data da alta',
  alta_condicao: 'Condição na alta',
  alta_orientacoes: 'Orientações da alta',
  alta_prognostico: 'Prognóstico',
}

export type CamposConsulta = Record<string, string | number | null>

export type VersaoConsulta = {
  versao: number
  dados: CamposConsulta
  motivo: string
  alteradoPorNome: string
  aprovadoPorNome: string
  alteradoEm: string
}

export type AlteracaoCampo = { campo: string; rotulo: string; antes: string; depois: string }

const texto = (valor: unknown) => (valor === null || valor === undefined ? '' : String(valor))
const ouNulo = (valor: string) => (valor.trim() ? valor : null)
const numeroOuNulo = (valor: string) => {
  const interpretado = parseFloat(valor.replace(',', '.'))
  return Number.isFinite(interpretado) ? interpretado : null
}

export function dadosParaCampos(dados: DadosAtendimento): CamposConsulta {
  return {
    observacoes: `Queixa: ${dados.queixaPrincipal}. Histórico: ${dados.historico}`,
    diagnostico: dados.diagnostico,
    conduta: dados.conduta,
    diagnostico_zoonose_status: dados.suspeitaZoonose ? 'suspeito' : 'negativo',
    diagnostico_zoonose_observacoes: dados.suspeitaZoonose || 'Sem suspeita de zoonose',
    temperatura: numeroOuNulo(dados.temperatura),
    frequencia_cardiaca: numeroOuNulo(dados.frequenciaCardiaca),
    frequencia_respiratoria: numeroOuNulo(dados.frequenciaRespiratoria),
    tpc: ouNulo(dados.tpc),
    mucosas: ouNulo(dados.mucosas),
    hidratacao: ouNulo(dados.hidratacao),
    nivel_consciencia: ouNulo(dados.nivelConsciencia),
    pele_pelagem: ouNulo(dados.pelePelagem),
    olhos: ouNulo(dados.olhos),
    ouvidos: ouNulo(dados.ouvidos),
    boca_dentes: ouNulo(dados.bocaDentes),
    sistema_respiratorio: ouNulo(dados.sistemaRespiratorio),
    sistema_cardiovascular: ouNulo(dados.sistemaCardiovascular),
    sistema_gastrointestinal: ouNulo(dados.sistemaGastrointestinal),
    sistema_urinario: ouNulo(dados.sistemaUrinario),
    sistema_reprodutivo: ouNulo(dados.sistemaReprodutivo),
    sistema_neurologico: ouNulo(dados.sistemaNeurologico),
    dor: ouNulo(dados.dor),
    alta_data: ouNulo(dados.dataAlta),
    alta_condicao: ouNulo(dados.condicaoAlta),
    alta_orientacoes: ouNulo(dados.orientacoesAlta),
    alta_prognostico: ouNulo(dados.prognosticoAlta),
  }
}

export function compararCampos(antes: CamposConsulta, depois: CamposConsulta): AlteracaoCampo[] {
  return Object.entries(CAMPOS_RETIFICAVEIS)
    .filter(([campo]) => texto(antes[campo]) !== texto(depois[campo]))
    .map(([campo, rotulo]) => ({ campo, rotulo, antes: texto(antes[campo]), depois: texto(depois[campo]) }))
}
