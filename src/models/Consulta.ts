import type { DiagnosticoZoonose } from './DiagnosticoZoonose'
import type { Exame } from './Exame'
import type { Medico } from './Medico'
import type { Pessoa } from './Pessoa'
import type { Pet } from './Pet'

export type ExameFisico = {
  temperatura?: number
  frequenciaCardiaca?: number
  frequenciaRespiratoria?: number
  tpc?: string
  mucosas?: string
  hidratacao?: string
  nivelConsciencia?: string
  pelePelagem?: string
  olhos?: string
  ouvidos?: string
  bocaDentes?: string
  sistemaRespiratorio?: string
  sistemaCardiovascular?: string
  sistemaGastrointestinal?: string
  sistemaUrinario?: string
  sistemaReprodutivo?: string
  sistemaNeurologico?: string
  dor?: string
}

export type Alta = {
  data?: string
  condicao?: string
  orientacoes?: string
  prognostico?: string
}

export type ParticipanteConsulta = {
  nome: string
  papel: 'registrou' | 'participante' | 'supervisor'
}

export class Consulta {
  conduta = ''
  private _id: number
  private _dataConsulta: Date
  private _horario: string
  private _diagnostico: string
  private _observacoes: string
  private _responsavel: Medico
  private _pet: Pet
  private _exames: Exame[]
  private _diagnosticoZoonose: DiagnosticoZoonose
  exameFisico: ExameFisico
  alta: Alta
  participantes: ParticipanteConsulta[] = []
  supervisorNome = ''
  liberacaoId: string | null = null
  versao = 1
  retificadoEm: Date | null = null
  retificadoPorNome = ''

  constructor(
    id: number,
    dataConsulta: Date,
    horario: string,
    diagnostico: string,
    observacoes: string,
    responsavel: Medico,
    pet: Pet,
    diagnosticoZoonose: DiagnosticoZoonose,
    exames: Exame[] = [],
    exameFisico: ExameFisico = {},
    alta: Alta = {},
  ) {
    this._id = id
    this._dataConsulta = dataConsulta
    this._horario = horario
    this._diagnostico = diagnostico
    this._observacoes = observacoes
    this._responsavel = responsavel
    this._pet = pet
    this._exames = exames
    this._diagnosticoZoonose = diagnosticoZoonose
    this.exameFisico = exameFisico
    this.alta = alta
  }

  get id(): number {
    return this._id
  }

  getId(): number {
    return this._id
  }

  get dataConsulta(): Date {
    return this._dataConsulta
  }

  getDataConsulta(): Date {
    return this._dataConsulta
  }

  get horario(): string {
    return this._horario
  }

  getHorario(): string {
    return this._horario
  }

  get diagnostico(): string {
    return this._diagnostico
  }

  getDiagnostico(): string {
    return this._diagnostico
  }

  set diagnostico(diagnostico: string) {
    this._diagnostico = diagnostico
  }

  setDiagnostico(diagnostico: string): void {
    this._diagnostico = diagnostico
  }

  get observacoes(): string {
    return this._observacoes
  }

  getObservacoes(): string {
    return this._observacoes
  }

  set observacoes(observacoes: string) {
    this._observacoes = observacoes
  }

  setObservacoes(observacoes: string): void {
    this._observacoes = observacoes
  }

  get responsavel(): Pessoa {
    return this._responsavel
  }

  getResponsavel(): Pessoa {
    return this._responsavel
  }

  get pet(): Pet {
    return this._pet
  }

  getPet(): Pet {
    return this._pet
  }

  get exames(): Exame[] {
    return [...this._exames]
  }

  getExames(): Exame[] {
    return [...this._exames]
  }

  get diagnosticoZoonose(): DiagnosticoZoonose {
    return this._diagnosticoZoonose
  }

  getDiagnosticoZoonose(): DiagnosticoZoonose {
    return this._diagnosticoZoonose
  }
}
