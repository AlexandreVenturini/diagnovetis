import { QueryClient } from '@tanstack/react-query'

export function criarClienteConsultas() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: 1 },
    },
  })
}

export const clienteConsultas = criarClienteConsultas()

export const CHAVES = {
  pets: ['pets'],
  agendamentos: ['agendamentos'],
  receitas: ['receitas'],
  receitasDoPet: ['receitas-do-pet'],
  resumosProntuario: ['prontuarios-resumo'],
  prontuario: ['prontuario'],
  consulta: ['consulta'],
  versoesConsulta: ['consulta-versoes'],
  atendimentosEmAndamento: ['atendimentos-em-andamento'],
  condicoes: ['condicoes'],
  medicamentos: ['medicamentos'],
  medicos: ['medicos'],
  veterinarios: ['veterinarios'],
  estudantes: ['estudantes'],
  usuariosAdmin: ['usuarios-admin'],
} as const
