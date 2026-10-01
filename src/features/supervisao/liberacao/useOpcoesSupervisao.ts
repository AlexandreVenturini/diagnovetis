import { useEffect, useState } from 'react'
import { SupervisaoService } from '../../../services/SupervisaoService'
import type { OpcaoEstudante, OpcaoVeterinario } from '../supervisaoTipos'

const supervisaoService = new SupervisaoService()

export function useOpcoesSupervisao(aoErro: (mensagem: string) => void) {
  const [veterinarios, setVeterinarios] = useState<OpcaoVeterinario[]>([])
  const [estudantes, setEstudantes] = useState<OpcaoEstudante[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true
    Promise.all([supervisaoService.listarVeterinarios(), supervisaoService.listarEstudantes()])
      .then(([listaVeterinarios, listaEstudantes]) => {
        if (!ativo) return
        setVeterinarios(listaVeterinarios)
        setEstudantes(listaEstudantes)
      })
      .catch(() => {
        if (ativo) aoErro('Não foi possível carregar os professores e estudantes. Tente novamente.')
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => {
      ativo = false
    }
  }, [aoErro])

  return { veterinarios, estudantes, carregando }
}
