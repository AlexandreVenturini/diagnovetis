export class DiagnosticoZoonose {
  private _status: string
  private _observacoes: string
  private _dataConfirmacao: Date

  constructor(status: string, observacoes: string, dataConfirmacao: Date) {
    this._status = status
    this._observacoes = observacoes
    this._dataConfirmacao = dataConfirmacao
  }

  get status(): string {
    return this._status
  }

  obterStatus(): string {
    return this._status
  }

  get observacoes(): string {
    return this._observacoes
  }

  obterObservacoes(): string {
    return this._observacoes
  }

  get dataConfirmacao(): Date {
    return this._dataConfirmacao
  }

  obterDataConfirmacao(): Date {
    return this._dataConfirmacao
  }
}
