import type { DadosClinicos } from '../features/condicoes/condicaoTipos'

export class Zoonose {
  dadosClinicos: DadosClinicos | null = null
  private _id: number
  private _nome: string
  private _agenteEtiologico: string
  private _sintomas: string
  private _medidasPreventivas: string
  private _grauRisco: string

  constructor(
    id: number,
    nome: string,
    agenteEtiologico: string,
    sintomas: string,
    medidasPreventivas: string,
    grauRisco: string,
  ) {
    this._id = id
    this._nome = nome
    this._agenteEtiologico = agenteEtiologico
    this._sintomas = sintomas
    this._medidasPreventivas = medidasPreventivas
    this._grauRisco = grauRisco
  }

  get nome(): string {
    return this._nome
  }

  get id(): number {
    return this._id
  }

  obterId(): number {
    return this._id
  }

  obterNome(): string {
    return this._nome
  }

  get agenteEtiologico(): string {
    return this._agenteEtiologico
  }

  obterAgenteEtiologico(): string {
    return this._agenteEtiologico
  }

  get sintomas(): string {
    return this._sintomas
  }

  obterSintomas(): string {
    return this._sintomas
  }

  get medidasPreventivas(): string {
    return this._medidasPreventivas
  }

  obterMedidasPreventivas(): string {
    return this._medidasPreventivas
  }

  get grauRisco(): string {
    return this._grauRisco
  }

  obterGrauRisco(): string {
    return this._grauRisco
  }

  ehAltoRisco(): boolean {
    return this._grauRisco.toLowerCase() === 'alto'
  }
}
