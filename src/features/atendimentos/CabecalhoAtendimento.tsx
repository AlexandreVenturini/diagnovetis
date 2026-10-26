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
