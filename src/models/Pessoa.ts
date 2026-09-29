export abstract class Pessoa {
  private _id: number
  private _nome: string
  private _telefone: string
  private _email: string

  constructor(id: number, nome: string, telefone: string, email: string) {
    this._id = id
    this._nome = nome
    this._telefone = telefone
    this._email = email
  }

  get id(): number {
    return this._id
  }

  getId(): number {
    return this._id
  }

  get nome(): string {
    return this._nome
  }

  getNome(): string {
    return this._nome
  }

  set nome(nome: string) {
    this._nome = nome
  }

  setNome(nome: string): void {
    this._nome = nome
  }

  get telefone(): string {
    return this._telefone
  }

  getTelefone(): string {
    return this._telefone
  }

  set telefone(telefone: string) {
    this._telefone = telefone
  }

  setTelefone(telefone: string): void {
    this._telefone = telefone
  }

  get email(): string {
    return this._email
  }

  getEmail(): string {
    return this._email
  }

  set email(email: string) {
    this._email = email
  }

  setEmail(email: string): void {
    this._email = email
  }
}
