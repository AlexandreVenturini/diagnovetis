import { Pessoa } from './Pessoa'

export class Medico extends Pessoa {
  private _especialidade: string
  private _crmv: string

  constructor(id: number, nome: string, telefone: string, email: string, especialidade: string, crmv: string) {
    super(id, nome, telefone, email)

    this._especialidade = especialidade
    this._crmv = crmv
  }

  get especialidade(): string {
    return this._especialidade
  }

  getEspecialidade(): string {
    return this._especialidade
  }

  set especialidade(especialidade: string) {
    this._especialidade = especialidade
  }

  setEspecialidade(especialidade: string): void {
    this._especialidade = especialidade
  }

  get crmv(): string {
    return this._crmv
  }

  getCrmv(): string {
    return this._crmv
  }

  set crmv(crmv: string) {
    this._crmv = crmv
  }

  setCrmv(crmv: string): void {
    this._crmv = crmv
  }

  temEspecialidade(): boolean {
    return this._especialidade.trim().length > 0
  }

  toString(): string {
    return `${this.nome} - CRMV ${this._crmv}`
  }
}
