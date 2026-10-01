import { useState } from 'react'
import type { ReactNode } from 'react'

export type CampoFicha = {
  rotulo: string
  valor?: string | number
  unidade?: string
  largo?: boolean
  multilinha?: boolean
  tipo?: 'date'
}

type SecaoFichaProps = {
  numero: string
  titulo: string
  className: string
  children: ReactNode
  editavel?: boolean
}

export function SecaoFicha({ numero, titulo, className, children, editavel = false }: SecaoFichaProps) {
  const [recolhido, setRecolhido] = useState(false)

  return (
    <fieldset
      className={`paper-section ${className}${recolhido ? ' collapsed' : ''}${editavel ? '' : ' paper-readonly'}`}
      disabled={!editavel}
    >
      <legend>
        <span>
          <b>{numero}.</b> {titulo}
        </span>
        <span className="paper-section-actions">
          <button
            type="button"
            className="collapse-section"
            aria-expanded={!recolhido}
            aria-label={`${recolhido ? 'Expandir' : 'Minimizar'} ${titulo}`}
            onClick={() => setRecolhido((valor) => !valor)}
          >
            {recolhido ? '＋' : '−'}
          </button>
        </span>
      </legend>
      {!recolhido && children}
    </fieldset>
  )
}

export function CamposFicha({ campos, variante }: { campos: CampoFicha[]; variante?: 'single' | 'single compact' }) {
  return (
    <div className={variante ? `paper-fields ${variante}` : 'paper-fields'}>
      {campos.map((campo) => (
        <label key={campo.rotulo} className={campo.largo ? 'wide' : undefined}>
          {campo.rotulo}
          {campo.multilinha ? (
            <textarea defaultValue={campo.valor} />
          ) : (
            <input type={campo.tipo} defaultValue={campo.valor} />
          )}
          {campo.unidade && ` ${campo.unidade}`}
        </label>
      ))}
    </div>
  )
}

export function TabelaFicha({
  cabecalhos,
  linhas,
}: {
  cabecalhos: string[]
  linhas: { key: string | number; valores: string[] }[]
}) {
  return (
    <table>
      <thead>
        <tr>
          {cabecalhos.map((cabecalho) => (
            <th key={cabecalho}>{cabecalho}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {linhas.map((linha) => (
          <tr key={linha.key}>
            {linha.valores.map((valor, indice) => (
              <td key={indice}>
                <input aria-label={`Campo ${indice + 1}`} defaultValue={valor} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
