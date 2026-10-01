import { useState } from 'react'
import type { ReactNode } from 'react'
import type { usePets } from './usePets'
import { DetalhesPet } from './DetalhesPet'
import { FormularioPet } from './FormularioPet'
import { ListaPets } from './ListaPets'
import type { PetResumo, DadosFormularioPet, TelaPets } from './petTipos'

type ModuloPetsProps = {
  petsApi: ReturnType<typeof usePets>
  telaInicial: TelaPets
  aviso?: ReactNode
}

export function ModuloPets({ petsApi, telaInicial, aviso }: ModuloPetsProps) {
  const { pets, criarPet, criarTutor, atualizarPet, removerPet } = petsApi
  const [tela, setTela] = useState<TelaPets>(telaInicial)
  const [selecionado, setSelecionado] = useState<PetResumo | null>(null)

  function aberto(proximo: TelaPets, pet: PetResumo) {
    setSelecionado(pet)
    setTela(proximo)
  }

  async function tratarCriacao(dados: DadosFormularioPet) {
    await criarPet(dados)
    setTela('lista')
  }

  async function tratarEdicao(dados: DadosFormularioPet) {
    if (!selecionado) return
    await atualizarPet(selecionado.id, dados)
    setTela('lista')
  }

  async function tratarRemocao(pet: PetResumo) {
    await removerPet(pet.id)
    setTela('lista')
  }

  return (
    <>
      {aviso}
      {tela === 'lista' && (
        <ListaPets
          pets={pets}
          aoCriar={() => setTela('cadastro')}
          aoEditar={(pet) => aberto('edicao', pet)}
          aoDetalhar={(pet) => aberto('detalhes', pet)}
        />
      )}
      {tela === 'cadastro' && (
        <FormularioPet aoSalvar={tratarCriacao} aoCriarTutor={criarTutor} aoCancelar={() => setTela('lista')} />
      )}
      {tela === 'edicao' && selecionado && (
        <FormularioPet
          pet={selecionado}
          editando
          aoSalvar={tratarEdicao}
          aoCriarTutor={criarTutor}
          aoCancelar={() => setTela('lista')}
        />
      )}
      {tela === 'detalhes' && selecionado && (
        <DetalhesPet pet={selecionado} aoVoltar={() => setTela('lista')} aoRemover={() => tratarRemocao(selecionado)} />
      )}
    </>
  )
}
