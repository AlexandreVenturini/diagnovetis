import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Pet } from '../../models/Pet'
import { PetService } from '../../services/PetService'
import { TutorService } from '../../services/TutorService'
import { CHAVES } from '../shared/consultas'
import { dataParaCampo } from '../shared/periodo'
import type { DadosFormularioTutor } from '../tutores/tutorTipos'
import type { PetResumo, DadosFormularioPet } from './petTipos'
import { formularioParaTutor, resolverResponsavel } from './resolverResponsavel'

const petService = new PetService()
const tutorService = new TutorService()

function petParaResumo(pet: Pet): PetResumo {
  return {
    id: pet.id,
    nome: pet.nome,
    raca: pet.raca,
    idade: pet.idade,
    peso: pet.peso,
    sexo: pet.sexo,
    tutor: pet.tutor.nome,
    contato: pet.tutor.telefone,
    historico: pet.historico,
    tipoResponsavel: pet.tutor.tipo,
    setor: pet.tutor.setor,
    observacoesResponsavel: pet.tutor.observacoes,
    cadastradoEm: pet.criadoEm ? dataParaCampo(new Date(pet.criadoEm)) : '',
    obitoEm: pet.obitoEm ? dataParaCampo(new Date(pet.obitoEm)) : '',
  }
}

const proximoId = (itens: { id: number }[]) => Math.max(0, ...itens.map((item) => item.id)) + 1

export function usePets() {
  const cliente = useQueryClient()
  const consulta = useQuery({
    queryKey: CHAVES.pets,
    queryFn: async () => (await petService.listarPets()).map(petParaResumo),
  })

  async function recarregar() {
    await Promise.all([
      cliente.invalidateQueries({ queryKey: CHAVES.pets }),
      cliente.invalidateQueries({ queryKey: CHAVES.prontuario }),
      cliente.invalidateQueries({ queryKey: CHAVES.resumosProntuario }),
    ])
  }

  async function criarPet(formulario: DadosFormularioPet) {
    const tutor = await resolverResponsavel(formulario)
    const pets = await petService.listarPets()
    const pet = new Pet(
      proximoId(pets),
      formulario.nome,
      'Cão',
      formulario.raca,
      tutor,
      [],
      formulario.idade,
      formulario.peso,
      formulario.sexo,
      formulario.historico,
    )
    await petService.adicionarPet(pet)
    await recarregar()
  }

  async function criarTutor(formulario: DadosFormularioTutor) {
    const tutores = await tutorService.listarTutores()
    await tutorService.adicionarTutor(formularioParaTutor(proximoId(tutores), formulario))
  }

  async function atualizarPet(id: number, formulario: DadosFormularioPet) {
    const atual = await petService.buscarPorId(id)
    const tutor = await resolverResponsavel(formulario, atual?.tutor)
    await petService.atualizarPet(id, {
      nome: formulario.nome,
      raca: formulario.raca,
      idade: formulario.idade,
      peso: formulario.peso,
      sexo: formulario.sexo,
      historico: formulario.historico,
      tutor_id: tutor.id,
    })
    await recarregar()
  }

  async function removerPet(id: number) {
    await petService.removerPet(id)
    await recarregar()
  }

  return { pets: consulta.data ?? [], criarPet, criarTutor, atualizarPet, removerPet }
}
