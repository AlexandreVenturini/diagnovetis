import { Medico } from '../models/Medico'
import { RepositorioSupabase } from './storage/RepositorioSupabase'

interface MedicoRow {
  id: number
  nome: string
  telefone: string
  email: string
  especialidade: string
  crmv: string
}

export const repositorioMedico = new RepositorioSupabase<Medico>(
  'medicos',
  (medico) => ({
    id: medico.id,
    nome: medico.nome,
    telefone: medico.telefone,
    email: medico.email,
    especialidade: medico.especialidade,
    crmv: medico.crmv,
  }),
  (bruto) => {
    const r = bruto as MedicoRow
    return new Medico(r.id, r.nome, r.telefone, r.email, r.especialidade, r.crmv)
  },
)

export class MedicoService {
  async listarMedicos(): Promise<Medico[]> {
    return repositorioMedico.listarTodos()
  }

  async buscarPorId(id: number): Promise<Medico | undefined> {
    return repositorioMedico.getById(id)
  }
}
