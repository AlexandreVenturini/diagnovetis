import type { ReactNode } from 'react'

type IconeProps = {
  children: ReactNode
}

export function Icone({ children }: IconeProps) {
  return (
    <svg className="ui-icon" viewBox="0 0 24 24" aria-hidden="true">
      {children}
    </svg>
  )
}
