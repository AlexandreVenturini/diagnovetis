type Aba<T extends string> = {
  id: T
  rotulo: string
  contador?: number
}

type AbasProps<T extends string> = {
  rotulo: string
  abas: Aba<T>[]
  ativa: T
  aoSelecionar: (id: T) => void
  desabilitado?: boolean
}

export function Abas<T extends string>({ rotulo, abas, ativa, aoSelecionar, desabilitado = false }: AbasProps<T>) {
  return (
    <div className="tabs" role="tablist" aria-label={rotulo}>
      {abas.map((aba) => (
        <button
          type="button"
          role="tab"
          key={aba.id}
          aria-selected={aba.id === ativa}
          className={aba.id === ativa ? 'active' : ''}
          disabled={desabilitado}
          onClick={() => aoSelecionar(aba.id)}
        >
          {aba.rotulo}
          {Boolean(aba.contador) && <span className="tab-count">{aba.contador}</span>}
        </button>
      ))}
    </div>
  )
}
