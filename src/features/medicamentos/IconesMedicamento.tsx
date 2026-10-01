import { Icone } from '../../components/common/Icone'

export function IconeComprimido() {
  return (
    <Icone>
      <path d="M8.5 19.5a5 5 0 0 1-7-7l7-7a5 5 0 0 1 7 7zM6 8l7 7" />
    </Icone>
  )
}

export function IconeBusca() {
  return (
    <Icone>
      <circle cx="11" cy="11" r="7" />
      <path d="m16 16 5 5" />
    </Icone>
  )
}

export function IconeCalculadora() {
  return (
    <Icone>
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M8 6h8v3H8zm0 7h1m3 0h1m3 0h1m-9 4h1m3 0h1m3 0h1" />
    </Icone>
  )
}
