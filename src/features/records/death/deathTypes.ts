export type DeathRecord = {
  id: number
  petId: number
  consultaId: number | null
  dataHora: string
  circunstancias: string
  causaProvavel: string
  houveReanimacao: boolean
  eutanasia: boolean
  medicoResponsavelId: number | null
  medicoResponsavelNome: string
  comunicadoResponsavel: boolean
  comunicacaoDetalhes: string
  necropsia: boolean
  destinoCorpo: string
  registradoPorNome: string
  aprovadoPorNome: string
  registradoEm: string
  versao: number
  retificadoEm: string | null
  retificadoPorNome: string
}

export type DeathVersion = {
  versao: number
  motivo: string
  alteradoPorNome: string
  alteradoEm: string
  alteracoes: { rotulo: string; antes: string; depois: string }[]
}
