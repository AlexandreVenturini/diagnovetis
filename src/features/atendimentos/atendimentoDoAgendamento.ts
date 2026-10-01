import type { Agendamento } from '../agenda/agendaTipos'
import type { PetResumo } from '../pets/petTipos'
import { ATENDIMENTO_VAZIO, type DadosAtendimento } from './atendimentoTipos'

export function atendimentoDoAgendamento(
  agendamento: Agendamento,
  pets: PetResumo[],
  atual: DadosAtendimento = ATENDIMENTO_VAZIO,
): DadosAtendimento {
  const normalizar = (valor: string) => valor.trim().toLocaleLowerCase('pt-BR')
  const pet =
    agendamento.petId !== undefined
      ? pets.find((item) => item.id === agendamento.petId)
      : pets.find(
          (item) =>
            normalizar(item.nome) === normalizar(agendamento.nomePet) &&
            normalizar(item.tutor) === normalizar(agendamento.nomeTutor),
        )
  return {
    ...atual,
    nomePet: agendamento.nomePet,
    nomeTutor: agendamento.nomeTutor,
    veterinario: agendamento.veterinario,
    idade: pet?.idade || agendamento.idadePet || '',
    raca: pet?.raca || agendamento.racaPet || '',
    queixaPrincipal: atual.queixaPrincipal || agendamento.tipoServico,
    historico: atual.historico || [pet?.historico, agendamento.observacoes].filter(Boolean).join('\n'),
  }
}
