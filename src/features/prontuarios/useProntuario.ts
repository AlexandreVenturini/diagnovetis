import { useCallback, useEffect, useState } from 'react'
import type { Exame } from '../../models/Exame'
import { buscarProntuario } from './carregarProntuarios'
import type { Prontuario } from './prontuarioTipos'

export function useProntuario(petIdInicial?: number) {
  const [paciente, setPaciente] = useState<Prontuario | null>(null)
  const [carregando, setCarregando] = useState(Boolean(petIdInicial))
  const [erro, setErro] = useState('')

  const carregar = useCallback(async (petId: number) => {
    setCarregando(true)
    setErro('')
    try {
      const encontrado = await buscarProntuario(petId)
      setPaciente(encontrado)
      if (!encontrado) setErro('Paciente não encontrado.')
    } catch {
      setErro('Não foi possível carregar o prontuário.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    if (petIdInicial === undefined) return
    let ativo = true
    buscarProntuario(petIdInicial)
      .then((encontrado) => {
        if (!ativo) return
        setPaciente(encontrado)
        setErro(encontrado ? '' : 'Paciente não encontrado.')
      })
      .catch(() => {
        if (ativo) setErro('Não foi possível carregar o prontuário.')
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => {
      ativo = false
    }
  }, [petIdInicial])

  function substituirExame(exame: Exame) {
    setPaciente(
      (atual) =>
        atual && {
          ...atual,
          atendimentos: atual.atendimentos.map((atendimento) =>
            atendimento.id === exame.consultaId
              ? {
                  ...atendimento,
                  examesComplementares: atendimento.examesComplementares?.map((item) =>
                    item.id === exame.id ? exame : item,
                  ),
                }
              : atendimento,
          ),
        },
    )
  }

  return { paciente, carregando, erro, carregar, limpar: () => setPaciente(null), substituirExame }
}
