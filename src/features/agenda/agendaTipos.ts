export type TipoAgendamento = 'scheduled' | 'walk-in'
export type SituacaoAgendamento = 'confirmed' | 'waiting' | 'in-progress' | 'completed' | 'no-show' | 'cancelled'
export type VisaoAgenda = 'dia' | 'semana' | 'mes'
export type TipoLembrete = 'return' | 'vaccination'

export type LembreteAgendamento = {
  id: number
  tipo: TipoLembrete
  data: string
  concluido: boolean
}

export type Agendamento = {
  id: number
  petId?: number
  idadePet?: string
  racaPet?: string
  tipo: TipoAgendamento
  nomePet: string
  nomeTutor: string
  data: string
  horario: string
  tipoServico: string
  veterinario: string
  observacoes: string
  status: SituacaoAgendamento
  motivoCancelamento: string
  lembretes: LembreteAgendamento[]
}

export type DadosFormularioAgendamento = Omit<Agendamento, 'id' | 'status' | 'motivoCancelamento' | 'lembretes'>
export type TelaAgenda = 'lista' | 'cadastro'
