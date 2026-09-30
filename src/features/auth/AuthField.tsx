import type { InputHTMLAttributes } from 'react'
import { Icon } from '../../components/common/Icon'

type AuthIcon = 'user' | 'mail' | 'lock' | 'card'

function AuthIconPaths({ name }: { name: AuthIcon }) {
  if (name === 'user')
    return (
      <>
        <circle cx="12" cy="8" r="3.25" />
        <path d="M5.5 20v-1.5a6.5 6.5 0 0 1 13 0V20" />
      </>
    )
  if (name === 'mail')
    return (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    )
  if (name === 'lock')
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

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string
  label: string
  icon: AuthIcon
}

export function AuthField({ id, label, icon, ...inputProps }: AuthFieldProps) {
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <div className="input-wrap">
        <Icon>
          <AuthIconPaths name={icon} />
        </Icon>
        <input id={id} {...inputProps} />
      </div>
    </>
  )
}
