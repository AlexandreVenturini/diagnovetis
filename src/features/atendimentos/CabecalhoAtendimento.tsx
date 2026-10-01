import { Icone } from '../../components/common/Icone'
import type { EtapaAtendimento } from './atendimentoTipos'

type CabecalhoAtendimentoProps = {
  etapaAtual: EtapaAtendimento
  aoAlterarEtapa: (etapa: EtapaAtendimento) => void
}

const etapas: Array<{ numero: EtapaAtendimento; rotulo: string }> = [
  { numero: 1, rotulo: 'Identificação' },
  { numero: 2, rotulo: 'Histórico Clínico' },
  { numero: 3, rotulo: 'Exame Físico' },
  { numero: 4, rotulo: 'Exames Complementares' },
  { numero: 5, rotulo: 'Diagnóstico e Conduta' },
]

export function CabecalhoAtendimento({ etapaAtual, aoAlterarEtapa }: CabecalhoAtendimentoProps) {
  return (
    <header className="consultation-header content-card">
      <h2>
        <Icone>
          <path d="M6 3h8l4 4v14H6zM14 3v5h5M9 12h6m-6 4h6" />
        </Icone>{' '}
        Atendimento Clínico (Cães)
      </h2>
      <p>
        Registre o atendimento clínico completo com histórico clínico, exame físico, exames complementares e
        diagnóstico.
      </p>
      <nav className="consultation-steps" aria-label="Etapas do atendimento">
        {etapas.map(({ numero, rotulo }) => (
          <button className={etapaAtual === numero ? 'active' : ''} onClick={() => aoAlterarEtapa(numero)} key={numero}>
            {numero}. {rotulo}
          </button>
        ))}
      </nav>
    </header>
  )
}
