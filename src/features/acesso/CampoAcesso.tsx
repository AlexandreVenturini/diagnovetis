import type { InputHTMLAttributes } from 'react'
import { Icone } from '../../components/common/Icone'

type IconeAcesso = 'usuario' | 'email' | 'cadeado' | 'cartao'

function TracosIconeAcesso({ nome }: { nome: IconeAcesso }) {
  if (nome === 'usuario')
    return (
      <>
        <circle cx="12" cy="8" r="3.25" />
        <path d="M5.5 20v-1.5a6.5 6.5 0 0 1 13 0V20" />
      </>
    )
  if (nome === 'email')
    return (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    )
  if (nome === 'cadeado')
    return (
      <>
        <rect x="4.5" y="10" width="15" height="10.5" rx="1.5" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    )
  return (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 9h6M7 13h10" />
    </>
  )
}

type CampoAcessoProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string
  rotulo: string
  icone: IconeAcesso
}

export function CampoAcesso({ id, rotulo, icone, ...propsCampo }: CampoAcessoProps) {
  return (
    <>
      <label htmlFor={id}>{rotulo}</label>
      <div className="input-wrap">
        <Icone>
          <TracosIconeAcesso nome={icone} />
        </Icone>
        <input id={id} {...propsCampo} />
      </div>
    </>
  )
}
