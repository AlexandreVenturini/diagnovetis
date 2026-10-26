import { useVeterinarios } from '../../supervisao/useEquipe'

export function useVeterinariosResponsaveis(emailUsuario: string | undefined) {
  const consulta = useVeterinarios()
  const veterinarios = consulta.data ?? []
  const email = emailUsuario?.toLocaleLowerCase('pt-BR')
  const proprio = email
    ? veterinarios.find((veterinario) => veterinario.email.toLocaleLowerCase('pt-BR') === email)
    : undefined
  return {
    veterinarios,
    proprio,
    erro: consulta.isError ? 'Não foi possível carregar a lista de veterinários.' : '',
  }
}
