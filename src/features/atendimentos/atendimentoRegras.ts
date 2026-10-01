import type { Agendamento } from '../agenda/agendaTipos'
import type { Liberacao, OpcaoVeterinario } from '../supervisao/supervisaoTipos'
import type { DadosAtendimento, EtapaAtendimento } from './atendimentoTipos'
import { validarExame, type RascunhoExame } from './exameTipos'

const normalizar = (valor: string) => valor.trim().toLocaleLowerCase('pt-BR')

export function aplicarVeterinario(
  dados: DadosAtendimento,
  veterinarios: OpcaoVeterinario[],
  liberacao: Liberacao | null,
  emailUsuario?: string,
): DadosAtendimento {
  if (liberacao)
    return { ...dados, veterinario: liberacao.supervisor.nome, veterinarioId: String(liberacao.supervisor.medicoId) }
  if (dados.veterinarioId && veterinarios.some((veterinario) => String(veterinario.medicoId) === dados.veterinarioId))
    return dados
  const veterinario =
    (dados.veterinario && veterinarios.find((item) => normalizar(item.nome) === normalizar(dados.veterinario))) ||
    (emailUsuario && veterinarios.find((item) => normalizar(item.email) === normalizar(emailUsuario)))
  return veterinario
    ? { ...dados, veterinario: veterinario.nome, veterinarioId: String(veterinario.medicoId) }
    : { ...dados, veterinarioId: '' }
}

export function agendamentosAbertos(agendamentos: Agendamento[]) {
  return agendamentos
    .filter((item) => !['completed', 'cancelled', 'no-show'].includes(item.status))
    .sort((a, b) => `${a.data}${a.horario}`.localeCompare(`${b.data}${b.horario}`))
}

export function validarAtendimento(
  dados: DadosAtendimento,
  exames: RascunhoExame[],
): { mensagem: string; etapa: EtapaAtendimento } | null {
  if (![dados.nomePet, dados.nomeTutor, dados.veterinarioId].every((valor) => valor.trim()))
    return { mensagem: 'Preencha a identificação do paciente antes de finalizar.', etapa: 1 }
  const erroExame = exames.map(validarExame).find(Boolean)
  return erroExame ? { mensagem: erroExame, etapa: 4 } : null
}
