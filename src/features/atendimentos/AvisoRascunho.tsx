import type { InicioAtendimento } from './salvarAtendimento'

type AvisoRascunhoProps = {
  id: number
  inicio: InicioAtendimento | null
  supervisorNome: string
}

export function AvisoRascunho({ id, inicio, supervisorNome }: AvisoRascunhoProps) {
  return (
    <aside className="profile-notice">
      <span>✎</span>
      <p>
        <strong>Atendimento em andamento nº {id}</strong>
        {inicio && ` · iniciado em ${inicio.data.toLocaleDateString('pt-BR')} às ${inicio.horario}`}
        {supervisorNome && ` · supervisão de ${supervisorNome}`}. Salve para continuar depois ou finalize quando
        terminar.
      </p>
    </aside>
  )
}
