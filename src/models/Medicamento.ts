export class Medicamento {
  private _id: number
  private _nomeComercial: string
  private _principioAtivo: string
  private _descricao: string
  private _concentracao: number
  private _unidadeConcentracao: string
  private _formaFarmaceutica: string
  private _viaAdministracao: string
  private _tipoUso: string

  constructor(
    id: number,
    nomeComercial: string,
    principioAtivo: string,
    descricao: string,
    concentracao: number,
    unidadeConcentracao: string,
    formaFarmaceutica: string,
    viaAdministracao: string,
    tipoUso: string,
  ) {
    this._id = id
    this._nomeComercial = nomeComercial
    this._principioAtivo = principioAtivo
    this._descricao = descricao
    this._concentracao = concentracao
    this._unidadeConcentracao = unidadeConcentracao
    this._formaFarmaceutica = formaFarmaceutica
    this._viaAdministracao = viaAdministracao
    this._tipoUso = tipoUso
  }

  get id(): number {
    return this._id
  }

  obterId(): number {
    return this._id
  }

  get nome(): string {
    return this._nomeComercial
  }

  obterNome(): string {
    return this._nomeComercial
  }

  get descricao(): string {
    return this._descricao
  }

  obterDescricao(): string {
    return this._descricao
  }

  get principioAtivo(): string {
    return this._principioAtivo
  }

  obterPrincipioAtivo(): string {
    return this._principioAtivo
  }

  get concentracao(): number {
    return this._concentracao
  }

  obterConcentracao(): number {
    return this._concentracao
  }

  get unidadeConcentracao(): string {
    return this._unidadeConcentracao
  }

  obterUnidadeConcentracao(): string {
    return this._unidadeConcentracao
  }

  get formaFarmaceutica(): string {
    return this._formaFarmaceutica
  }

  obterFormaFarmaceutica(): string {
    return this._formaFarmaceutica
  }

  get viaAdministracao(): string {
    return this._viaAdministracao
  }

  obterViaAdministracao(): string {
    return this._viaAdministracao
  }

  get tipo(): string {
    return this._tipoUso
  }

  obterTipo(): string {
    return this._tipoUso
  }
}
