import { useEstudantes, useVeterinarios } from '../useEquipe'

export function useOpcoesSupervisao() {
  const veterinarios = useVeterinarios()
  const estudantes = useEstudantes()
  return {
    veterinarios: veterinarios.data ?? [],
    estudantes: estudantes.data ?? [],
    carregando: veterinarios.isPending || estudantes.isPending,
    erro:
      veterinarios.isError || estudantes.isError
        ? 'Não foi possível carregar os professores e estudantes. Tente novamente.'
        : '',
  }
}
