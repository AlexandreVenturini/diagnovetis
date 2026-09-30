import { PetService } from '../../services/PetService'
import { ConsultaService } from '../../services/ConsultaService'
import type { Consulta } from '../../models/Consulta'
import type { Pet } from '../../models/Pet'
import type { DateRange } from '../common/period'
import { buscarObito } from './death/death'
import type { SummaryItem } from './patientSummaries'
import type { ClinicalRecord, PatientRecord } from './recordTypes'

const petService = new PetService()
const consultaService = new ConsultaService()

function petInfo(pet: Pet): SummaryItem['pet'] {
  return { id: pet.id, dogName: pet.nome, tutorName: pet.tutor.nome, breed: pet.raca, weight: pet.peso }
}

export async function fetchSummaries(range: DateRange | null): Promise<SummaryItem[]> {
  const resumos = await consultaService.listarResumo(range)
  const pets = range
    ? await petService.listarPorIds([...new Set(resumos.map((r) => r.petId))])
    : await petService.listarPets()
  const petsPorId = new Map(pets.map((pet) => [pet.id, pet]))
  const items: SummaryItem[] = resumos
    .filter((r) => petsPorId.has(r.petId))
    .map((r) => ({
      key: `c-${r.id}`,
      consultaId: r.id,
      date: r.date,
      veterinarian: r.veterinarian,
      pet: petInfo(petsPorId.get(r.petId)!),
    }))
  if (!range) {
    const comAtendimento = new Set(resumos.map((r) => r.petId))
    for (const pet of pets) {
      if (!comAtendimento.has(pet.id))
        items.push({ key: `p-${pet.id}`, consultaId: null, date: '', veterinarian: '', pet: petInfo(pet) })
    }
  }
  return items
}

function toClinicalRecord(c: Consulta): ClinicalRecord {
  return {
    id: c.id,
    date: c.dataConsulta.toISOString().slice(0, 10),
    veterinarian: c.responsavel.nome,
    crmv: (c.responsavel as { crmv?: string }).crmv ?? '',
    students: c.participantes.filter((p) => p.papel !== 'supervisor' && p.nome !== c.supervisorNome).map((p) => p.nome),
    description: c.observacoes ?? '',
    diagnosis: c.diagnostico ?? '',
    conduct: c.conduta,
    complementaryExams: c.exames,
    validatedBy: c.supervisorNome || c.responsavel.nome,
    exameFisico: c.exameFisico,
    alta: c.alta,
    versao: c.versao,
    retificadoEm: c.retificadoEm,
    retificadoPorNome: c.retificadoPorNome,
  }
}

function buildPatientRecord(pet: Pet, consultas: Consulta[]): PatientRecord {
  const e = pet.tutor.endereco
  return {
    id: pet.id,
    dogName: pet.nome,
    tutorName: pet.tutor.nome,
    tutorCpf: pet.tutor.cpf ?? '',
    tutorPhone: pet.tutor.telefone ?? '',
    tutorEmail: pet.tutor.email ?? '',
    tutorAddress: e ? `${e.rua}, ${e.numero}${e.bairro ? ` — ${e.bairro}` : ''}` : '',
    tutorCity: e ? `${e.cidade}/${e.uf}` : '',
    breed: pet.raca,
    age: pet.idade,
    sex: pet.sexo,
    allergies: [],
    previousDiseases: pet.historico ? [pet.historico] : [],
    vaccines: [],
    weights: pet.peso ? [{ date: new Date().toISOString().slice(0, 10), weight: parseFloat(pet.peso) || 0 }] : [],
    records: consultas.map(toClinicalRecord),
  }
}

export async function fetchPatient(petId: number): Promise<PatientRecord | null> {
  const [pets, consultas, death] = await Promise.all([
    petService.listarPorIds([petId]),
    consultaService.listarPorPet(petId),
    buscarObito(petId),
  ])
  return pets[0] ? { ...buildPatientRecord(pets[0], consultas), death } : null
}
