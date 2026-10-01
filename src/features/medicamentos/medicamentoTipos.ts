export type MedicamentoResumo = {
  id: number
  nomeComercial: string
  principioAtivo: string
  indicacoes: string[]
  dosagem: string
  doseMgKg: number
  frequencia: string
  via: string
  concentracao: string
  concentracaoMgMl: number | null
  contraindicacoes: string[]
  observacoes: string
}

export type DadosFormularioMedicamento = Omit<MedicamentoResumo, 'id' | 'indicacoes' | 'contraindicacoes'> & {
  indicacoes: string
  contraindicacoes: string
}
