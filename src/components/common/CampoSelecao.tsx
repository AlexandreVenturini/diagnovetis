export type OpcaoSelecao = string | { valor: string; rotulo: string }

type CampoSelecaoProps = {
  rotulo: string
  valor: string
  aoAlterar: (valor: string) => void
  opcoes: OpcaoSelecao[]
  rotuloTodos?: string
  valorTodos?: string
}

const valorDe = (opcao: OpcaoSelecao) => (typeof opcao === 'string' ? opcao : opcao.valor)
const rotuloDe = (opcao: OpcaoSelecao) => (typeof opcao === 'string' ? opcao : opcao.rotulo)

export function CampoSelecao({
  rotulo,
  valor,
  aoAlterar,
  opcoes,
  rotuloTodos = 'Todos',
  valorTodos = '',
}: CampoSelecaoProps) {
  return (
    <label className="filter-field">
      <span>{rotulo}</span>
      <select value={valor} onChange={(evento) => aoAlterar(evento.target.value)}>
        <option value={valorTodos}>{rotuloTodos}</option>
        {opcoes.map((opcao) => (
          <option key={valorDe(opcao)} value={valorDe(opcao)}>
            {rotuloDe(opcao)}
          </option>
        ))}
      </select>
    </label>
  )
}
