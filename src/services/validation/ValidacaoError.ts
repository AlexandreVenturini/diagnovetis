export class ValidacaoError extends Error {
  readonly campo: string

  constructor(campo: string, mensagem: string) {
    super(mensagem)
    this.name = 'ValidacaoError'
    this.campo = campo
  }
}
