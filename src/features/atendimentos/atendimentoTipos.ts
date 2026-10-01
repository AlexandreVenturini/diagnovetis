export type EtapaAtendimento = 1 | 2 | 3 | 4 | 5

export type DadosAtendimento = {
  nomePet: string
  idade: string
  raca: string
  nomeTutor: string
  veterinario: string
  veterinarioId: string
  idPaciente?: string
  peso?: string
  queixaPrincipal: string
  historico: string
  mucosas: string
  tpc: string
  frequenciaCardiaca: string
  frequenciaRespiratoria: string
  temperatura: string
  hidratacao: string
  nivelConsciencia: string
  pelePelagem: string
  olhos: string
  ouvidos: string
  bocaDentes: string
  sistemaRespiratorio: string
  sistemaCardiovascular: string
  sistemaGastrointestinal: string
  sistemaUrinario: string
  sistemaReprodutivo: string
  sistemaNeurologico: string
  dor: string
  diagnostico: string
  suspeitaZoonose: string
  conduta: string
  dataAlta: string
  condicaoAlta: string
  orientacoesAlta: string
  prognosticoAlta: string
}

export const ATENDIMENTO_VAZIO: DadosAtendimento = {
  nomePet: '',
  idade: '',
  raca: '',
  nomeTutor: '',
  veterinario: '',
  veterinarioId: '',
  queixaPrincipal: '',
  historico: '',
  mucosas: '',
  tpc: '',
  frequenciaCardiaca: '',
  frequenciaRespiratoria: '',
  temperatura: '',
  hidratacao: 'Normal',
  nivelConsciencia: 'Alerta',
  pelePelagem: '',
  olhos: '',
  ouvidos: '',
  bocaDentes: '',
  sistemaRespiratorio: '',
  sistemaCardiovascular: '',
  sistemaGastrointestinal: '',
  sistemaUrinario: '',
  sistemaReprodutivo: '',
  sistemaNeurologico: '',
  dor: '',
  diagnostico: '',
  suspeitaZoonose: '',
  conduta: '',
  dataAlta: '',
  condicaoAlta: '',
  orientacoesAlta: '',
  prognosticoAlta: '',
}
