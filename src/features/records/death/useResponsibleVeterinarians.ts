import { useEffect, useState } from 'react'
import { listarVeterinarios } from '../../supervision/supervision'
import type { VeterinarianOption } from '../../supervision/supervisionTypes'

type Callbacks = {
  onSelf: (vet: VeterinarianOption) => void
  onError: (message: string) => void
}

export function useResponsibleVeterinarians(userEmail: string | undefined, { onSelf, onError }: Callbacks) {
  const [veterinarians, setVeterinarians] = useState<VeterinarianOption[]>([])

  useEffect(() => {
    let active = true
    listarVeterinarios()
      .then((vets) => {
        if (!active) return
        setVeterinarians(vets)
        const email = userEmail?.toLocaleLowerCase('pt-BR')
        const self = email && vets.find((vet) => vet.email.toLocaleLowerCase('pt-BR') === email)
        if (self) onSelf(self)
      })
      .catch(() => {
        if (active) onError('Não foi possível carregar a lista de veterinários.')
      })
    return () => {
      active = false
    }
  }, [userEmail, onSelf, onError])

  return veterinarians
}
