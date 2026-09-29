import { Medico } from '../models/Medico'
import { SupabaseRepository } from './storage/SupabaseRepository'

interface MedicoRow {
  id: number
  nome: string
  telefone: string
  email: string
  especialidade: string
  crmv: string
}

export const medicoRepository = new SupabaseRepository<Medico>(
  'medicos',
  (medico) => ({
    id: medico.id,
    nome: medico.nome,
    telefone: medico.telefone,
    email: medico.email,
    especialidade: medico.especialidade,
    crmv: medico.crmv,
  }),
  (raw) => {
    const r = raw as MedicoRow
    return new Medico(r.id, r.nome, r.telefone, r.email, r.especialidade, r.crmv)
  },
)

export class MedicoService {
  async listarMedicos(): Promise<Medico[]> {
    return medicoRepository.getAll()
  }

  async buscarPorId(id: number): Promise<Medico | undefined> {
    return medicoRepository.getById(id)
  }
}
