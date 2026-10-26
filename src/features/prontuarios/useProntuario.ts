import { useCallback, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Exame } from '../../models/Exame'
import { CHAVES } from '../shared/consultas'
import { buscarProntuario } from './carregarProntuarios'
import type { Prontuario } from './prontuarioTipos'

const chaveProntuario = (petId: number | null) => [...CHAVES.prontuario, petId]

function comExameSubstituido(paciente: Prontuario, exame: Exame): Prontuario {
  return {
    ...paciente,
    atendimentos: paciente.atendimentos.map((atendimento) =>
      atendimento.id === exame.consultaId
        ? {
            ...atendimento,
            examesComplementares: atendimento.examesComplementares?.map((item) =>
              item.id === exame.id ? exame : item,
            ),
          }
        : atendimento,
    ),
  }
}

export function useProntuario(petIdInicial?: number) {
  const cliente = useQueryClient()
  const [petId, setPetId] = useState<number | null>(petIdInicial ?? null)
  const consulta = useQuery({
    queryKey: chaveProntuario(petId),
    queryFn: () => buscarProntuario(petId as number),
    enabled: petId !== null,
  })

  const carregar = useCallback(
    async (id: number) => {
      setPetId(id)
      await cliente.invalidateQueries({ queryKey: chaveProntuario(id) })
    },
    [cliente],
  )

  function substituirExame(exame: Exame) {
    cliente.setQueryData<Prontuario | null>(chaveProntuario(petId), (atual) =>
      atual ? comExameSubstituido(atual, exame) : atual,
    )
  }

  const naoEncontrado = consulta.isSuccess && consulta.data === null
  return {
    paciente: petId === null ? null : (consulta.data ?? null),
    carregando: petId !== null && consulta.isPending,
    erro: consulta.isError
      ? 'Não foi possível carregar o prontuário.'
      : naoEncontrado
        ? 'Paciente não encontrado.'
        : '',
    carregar,
    limpar: () => setPetId(null),
    substituirExame,
  }
}
