import type { ReactNode } from 'react'
import { Icone } from '../../components/common/Icone'
import type { ModuloPainel } from './useNavegacaoPainel'

type NomeIcone = 'grafico' | 'pata' | 'calendario' | 'estetoscopio' | 'arquivo' | 'banco' | 'comprimido'

const ITENS_MENU: { rotulo: string; icone: NomeIcone; modulo: ModuloPainel }[] = [
  { rotulo: 'Dashboard', icone: 'grafico', modulo: 'inicio' },
  { rotulo: 'Cadastro', icone: 'pata', modulo: 'pets' },
  { rotulo: 'Agendamento', icone: 'calendario', modulo: 'agenda' },
  { rotulo: 'Atendimento', icone: 'estetoscopio', modulo: 'atendimentos' },
  { rotulo: 'Receituário', icone: 'arquivo', modulo: 'receitas' },
  { rotulo: 'Prontuários', icone: 'arquivo', modulo: 'prontuarios' },
  { rotulo: 'Condições Clínicas', icone: 'banco', modulo: 'condicoes' },
  { rotulo: 'Medicamentos', icone: 'comprimido', modulo: 'medicamentos' },
]

const TRACOS: Record<NomeIcone, ReactNode> = {
  pata: (
    <>
      <circle cx="7" cy="6" r="2" />
      <circle cx="15" cy="5" r="2" />
      <circle cx="18" cy="11" r="2" />
      <path d="M7 13c2-4 8-2 9 2 1 4-3 5-5 3-2 2-6 0-4-5Z" />
    </>
  ),
  calendario: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M7 3v4m10-4v4M3 10h18" />
    </>
  ),
  estetoscopio: (
    <>
      <path d="M5 3v6a5 5 0 0 0 10 0V3m-12 0h4m6 0h4m-7 11v2a4 4 0 0 0 8 0v-2" />
      <circle cx="18" cy="12" r="2" />
    </>
  ),
  arquivo: <path d="M6 3h8l4 4v14H6zM14 3v5h5M9 12h6m-6 4h6" />,
  banco: (
    <>
      <ellipse cx="12" cy="5" rx="7" ry="3" />
      <path d="M5 5v7c0 1.7 3.1 3 7 3s7-1.3 7-3V5m-14 7v7c0 1.7 3.1 3 7 3s7-1.3 7-3v-7" />
    </>
  ),
  comprimido: <path d="M8.5 19.5a5 5 0 0 1-7-7l7-7a5 5 0 0 1 7 7zM6 8l7 7" />,
  grafico: <path d="M4 20V10m6 10V4m6 16v-7m5 7H2" />,
}

type MenuPrincipalProps = {
  moduloAtivo: ModuloPainel
  aoSelecionar: (modulo: ModuloPainel) => void
}

export function MenuPrincipal({ moduloAtivo, aoSelecionar }: MenuPrincipalProps) {
  return (
    <nav className="main-nav" aria-label="Módulos do sistema">
      {ITENS_MENU.map(({ rotulo, icone, modulo }) => (
        <button
          className={modulo === moduloAtivo ? 'active' : ''}
          key={rotulo}
          onClick={() => modulo && aoSelecionar(modulo)}
          disabled={!modulo}
        >
          <Icone>{TRACOS[icone]}</Icone>
          {rotulo}
        </button>
      ))}
    </nav>
  )
}
