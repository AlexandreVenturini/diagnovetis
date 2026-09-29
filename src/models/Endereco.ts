export class Endereco {
  private _rua: string
  private _numero: number
  private _bairro: string
  private _cidade: string
  private _uf: string
  private _cep: string

  constructor(rua: string, numero: number, bairro: string, cidade: string, uf: string, cep: string) {
    this._rua = rua
    this._numero = numero
    this._bairro = bairro
    this._cidade = cidade
    this._uf = uf
    this._cep = cep
  }

  get rua(): string {
    return this._rua
  }

  getRua(): string {
    return this._rua
  }

  set rua(rua: string) {
    this._rua = rua
  }

  setRua(rua: string): void {
    this._rua = rua
  }

  get numero(): number {
    return this._numero
  }

  getNumero(): number {
    return this._numero
  }

  set numero(numero: number) {
    this._numero = numero
  }

  setNumero(numero: number): void {
    this._numero = numero
  }

  get bairro(): string {
    return this._bairro
  }

  getBairro(): string {
    return this._bairro
  }

  set bairro(bairro: string) {
    this._bairro = bairro
  }

  setBairro(bairro: string): void {
    this._bairro = bairro
  }

  get cidade(): string {
    return this._cidade
  }

  getCidade(): string {
    return this._cidade
  }

  set cidade(cidade: string) {
    this._cidade = cidade
  }

  setCidade(cidade: string): void {
    this._cidade = cidade
  }

  get uf(): string {
    return this._uf
  }

  getUf(): string {
    return this._uf
  }

  set uf(uf: string) {
    this._uf = uf
  }

  setUf(uf: string): void {
    this._uf = uf
  }

  get cep(): string {
    return this._cep
  }

  getCep(): string {
    return this._cep
  }

  set cep(cep: string) {
    this._cep = cep
  }

  setCep(cep: string): void {
    this._cep = cep
  }
}
