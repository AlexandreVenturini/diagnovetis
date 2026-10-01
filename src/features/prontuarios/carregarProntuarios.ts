import { PetService } from '../../services/PetService'
import { ConsultaService } from '../../services/ConsultaService'
import { ObitoService } from '../../services/ObitoService'
import type { Consulta } from '../../models/Consulta'
import type { Pet } from '../../models/Pet'
import type { Intervalo } from '../shared/periodo'
import type { ItemResumo } from './resumoProntuarios'
import type { RegistroClinico, Prontuario } from './prontuarioTipos'

const petService = new PetService()
const consultaService = new ConsultaService()
const obitoService = new ObitoService()

function infoPet(pet: Pet): ItemResumo['pet'] {
  return { id: pet.id, nomePet: pet.nome, nomeTutor: pet.tutor.nome, raca: pet.raca, peso: pet.peso }
}

export async function buscarResumos(intervalo: Intervalo | null): Promise<ItemResumo[]> {
  const resumos = await consultaService.listarResumo(intervalo)
  const pets = intervalo
    ? await petService.listarPorIds([...new Set(resumos.map((r) => r.petId))])
    : await petService.listarPets()
  const petsPorId = new Map(pets.map((pet) => [pet.id, pet]))
  const itens: ItemResumo[] = resumos
    .filter((r) => petsPorId.has(r.petId))
    .map((r) => ({
      key: `c-${r.id}`,
      consultaId: r.id,
      data: r.data,
      veterinario: r.veterinario,
      pet: infoPet(petsPorId.get(r.petId)!),
    }))
  if (!intervalo) {
    const comAtendimento = new Set(resumos.map((r) => r.petId))
    for (const pet of pets) {
      if (!comAtendimento.has(pet.id))
        itens.push({ key: `p-${pet.id}`, consultaId: null, data: '', veterinario: '', pet: infoPet(pet) })
    }
  }
  return itens
}

function paraRegistroClinico(c: Consulta): RegistroClinico {
  return {
    id: c.id,
    data: c.dataConsulta.toISOString().slice(0, 10),
    veterinario: c.responsavel.nome,
    crmv: (c.responsavel as { crmv?: string }).crmv ?? '',
    estudantes: c.participantes
      .filter((p) => p.papel !== 'supervisor' && p.nome !== c.supervisorNome)
      .map((p) => p.nome),
    descricao: c.observacoes ?? '',
    diagnostico: c.diagnostico ?? '',
    conduta: c.conduta,
    examesComplementares: c.exames,
    validadoPor: c.supervisorNome || c.responsavel.nome,
    exameFisico: c.exameFisico,
    alta: c.alta,
    versao: c.versao,
    retificadoEm: c.retificadoEm,
    retificadoPorNome: c.retificadoPorNome,
  }
}

function montarProntuario(pet: Pet, consultas: Consulta[]): Prontuario {
  const e = pet.tutor.endereco
  return {
    id: pet.id,
    nomePet: pet.nome,
    nomeTutor: pet.tutor.nome,
    cpfTutor: pet.tutor.cpf ?? '',
    telefoneTutor: pet.tutor.telefone ?? '',
    emailTutor: pet.tutor.email ?? '',
    enderecoTutor: e ? `${e.rua}, ${e.numero}${e.bairro ? ` — ${e.bairro}` : ''}` : '',
    cidadeTutor: e ? `${e.cidade}/${e.uf}` : '',
    tipoResponsavel: pet.tutor.tipo,
    cnpjTutor: pet.tutor.cnpj,
    contatoTutor: pet.tutor.contato,
    setorTutor: pet.tutor.setor,
    observacoesTutor: pet.tutor.observacoes,
    raca: pet.raca,
    idade: pet.idade,
    sexo: pet.sexo,
    alergias: [],
    doencasAnteriores: pet.historico ? [pet.historico] : [],
    vacinas: [],
    pesos: pet.peso ? [{ data: new Date().toISOString().slice(0, 10), peso: parseFloat(pet.peso) || 0 }] : [],
    atendimentos: consultas.map(paraRegistroClinico),
  }
}

export async function buscarProntuario(petId: number): Promise<Prontuario | null> {
  const [pets, consultas, obito] = await Promise.all([
    petService.listarPorIds([petId]),
    consultaService.listarPorPet(petId),
    obitoService.buscar(petId),
  ])
  return pets[0] ? { ...montarProntuario(pets[0], consultas), obito } : null
}
