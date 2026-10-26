import type { ReactNode } from 'react'

type CabecalhoTelaProps = {
  titulo: ReactNode
  descricao?: ReactNode
  acoes?: ReactNode
  voltar?: { rotulo: string; aoClicar: () => void }
}

export function CabecalhoTela({ titulo, descricao, acoes, voltar }: CabecalhoTelaProps) {
  return (
    <header className="page-header">
      <div className="page-header-text">
        {voltar && (
          <button type="button" className="text-back-button" onClick={voltar.aoClicar}>
            ‹ {voltar.rotulo}
          </button>
        )}
        <h2>{titulo}</h2>
        {descricao && <p>{descricao}</p>}
      </div>
      {acoes && <div className="page-header-actions">{acoes}</div>}
    </header>
  )
}
