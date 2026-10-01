import type { DadosFormularioAgendamento } from './agendaTipos'

export const AGENDAMENTO_VAZIO: DadosFormularioAgendamento = {
  tipo: 'scheduled',
  petId: undefined,
  idadePet: '',
  racaPet: '',
  nomePet: '',
  nomeTutor: '',
  data: '',
  horario: '',
  tipoServico: '',
  veterinario: '',
  observacoes: '',
}
