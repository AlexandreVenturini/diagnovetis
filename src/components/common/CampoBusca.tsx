import { Icone } from './Icone'

type CampoBuscaProps = {
  valor: string
  aoAlterar: (valor: string) => void
  placeholder: string
  rotulo?: string
}

export function CampoBusca({ valor, aoAlterar, placeholder, rotulo = 'Buscar' }: CampoBuscaProps) {
  return (
    <label className="filter-field search-field">
      <span>{rotulo}</span>
      <span className="search-input">
        <Icone>
          <circle cx="11" cy="11" r="7" />
          <path d="m16 16 5 5" />
        </Icone>
        <input value={valor} onChange={(evento) => aoAlterar(evento.target.value)} placeholder={placeholder} />
        {valor && (
          <button type="button" aria-label="Limpar busca" onClick={() => aoAlterar('')}>
            ×
          </button>
        )}
      </span>
    </label>
  )
}
