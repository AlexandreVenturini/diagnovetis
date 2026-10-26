type StatusAtualizacaoProps = {
  carregando: boolean
  erro?: string
  atualizadoEm: Date | null
  aoAtualizar: () => void
}

const formatarHorario = (data: Date) => data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

export function StatusAtualizacao({ carregando, erro = '', atualizadoEm, aoAtualizar }: StatusAtualizacaoProps) {
  const situacao = carregando ? 'Atualizando…' : erro ? 'Falha na atualização' : 'Sistema conectado'
  return (
    <>
      <div className={`sync-status${erro ? ' offline' : ''}`} role="status">
        <i />
        <span>
          <strong>{situacao}</strong>
          <small>{atualizadoEm ? `Atualizado às ${formatarHorario(atualizadoEm)}` : 'Aguardando dados'}</small>
        </span>
      </div>
      <button type="button" className="outline-button" disabled={carregando} onClick={aoAtualizar}>
        Atualizar dados
      </button>
    </>
  )
}
