import { useCallback, useEffect, useState } from 'react'
import { Endereco } from '../../models/Endereco'
import { Pet } from '../../models/Pet'
import { Tutor } from '../../models/Tutor'
import { PetService } from '../../services/PetService'
import { TutorService } from '../../services/TutorService'
import { dataParaCampo } from '../shared/periodo'
import type { DadosFormularioTutor } from '../tutores/tutorTipos'
import type { PetResumo, DadosFormularioPet } from './petTipos'

const petService = new PetService()
const tutorService = new TutorService()

export class TutorNaoEncontradoError extends Error {
  constructor(nome: string) {
    super(`Tutor '${nome}' não encontrado. Cadastre o tutor completo antes de registrar o cão.`)
    this.name = 'TutorNotFoundError'
  }
}

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
    cadastradoEm: pet.criadoEm ? dataParaCampo(new Date(pet.criadoEm)) : '',
    obitoEm: pet.obitoEm ? dataParaCampo(new Date(pet.obitoEm)) : '',
  }
}

function formularioParaTutor(id: number, formulario: DadosFormularioTutor): Tutor {
  return new Tutor(
    id,
    formulario.nome.trim(),
    formulario.telefone.trim(),
    formulario.email.trim(),
    new Date(`${formulario.dataCadastro}T12:00:00`),
    new Endereco(
      formulario.rua.trim(),
      Number(formulario.numero),
      formulario.bairro.trim(),
      formulario.cidade.trim(),
      formulario.estado.trim().toUpperCase(),
      formulario.cep.trim(),
    ),
    [],
    formulario.cpf?.trim() ?? '',
  )
}

async function encontrarTutor(nome: string): Promise<Tutor> {
  const [tutor] = await tutorService.buscarPorNome(nome)
  if (!tutor) throw new TutorNaoEncontradoError(nome)
  return tutor
}

const proximoId = (itens: { id: number }[]) => Math.max(0, ...itens.map((item) => item.id)) + 1

export function usePets() {
  const [pets, setPets] = useState<PetResumo[]>([])

  const recarregar = useCallback(async () => {
    try {
      const pets = await petService.listarPets()
      setPets(pets.map(petParaResumo))
    } catch {
      setPets([])
    }
  }, [])

  useEffect(() => {
    let ativo = true
    petService
      .listarPets()
      .then((pets) => {
        if (ativo) setPets(pets.map(petParaResumo))
      })
      .catch(() => {
        if (ativo) setPets([])
      })
    return () => {
      ativo = false
    }
  }, [])

  async function criarPet(formulario: DadosFormularioPet) {
    const tutor = await encontrarTutor(formulario.tutor)
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
    await petService.atualizarPet(id, {
      nome: formulario.nome,
      raca: formulario.raca,
      idade: formulario.idade,
      peso: formulario.peso,
      sexo: formulario.sexo,
      historico: formulario.historico,
    })
    await recarregar()
  }

  async function removerPet(id: number) {
    await petService.removerPet(id)
    await recarregar()
  }

  return { pets, criarPet, criarTutor, atualizarPet, removerPet }
}
