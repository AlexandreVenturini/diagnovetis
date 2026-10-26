type CabecalhoListaProps = {
  titulo: string
  contagem: string
}

export function CabecalhoLista({ titulo, contagem }: CabecalhoListaProps) {
  return (
    <div className="list-heading">
      <h3>{titulo}</h3>
      <span>{contagem}</span>
    </div>
  )
}
