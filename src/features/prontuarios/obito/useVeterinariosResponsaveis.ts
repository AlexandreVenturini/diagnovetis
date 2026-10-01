import { useEffect, useState } from 'react'
import { SupervisaoService } from '../../../services/SupervisaoService'
import type { OpcaoVeterinario } from '../../supervisao/supervisaoTipos'

const supervisaoService = new SupervisaoService()

type Retornos = {
  aoEncontrarProprio: (veterinario: OpcaoVeterinario) => void
  aoErro: (mensagem: string) => void
}

export function useVeterinariosResponsaveis(
  emailUsuario: string | undefined,
  { aoEncontrarProprio, aoErro }: Retornos,
) {
  const [veterinarios, setVeterinarios] = useState<OpcaoVeterinario[]>([])

  useEffect(() => {
    let ativo = true
    supervisaoService
      .listarVeterinarios()
      .then((listaVeterinarios) => {
        if (!ativo) return
        setVeterinarios(listaVeterinarios)
        const email = emailUsuario?.toLocaleLowerCase('pt-BR')
        const proprio =
          email && listaVeterinarios.find((veterinario) => veterinario.email.toLocaleLowerCase('pt-BR') === email)
        if (proprio) aoEncontrarProprio(proprio)
      })
      .catch(() => {
        if (ativo) aoErro('Não foi possível carregar a lista de veterinários.')
      })
    return () => {
      ativo = false
    }
  }, [emailUsuario, aoEncontrarProprio, aoErro])

  return veterinarios
}
