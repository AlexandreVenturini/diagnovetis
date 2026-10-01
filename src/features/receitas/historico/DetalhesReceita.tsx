import type { ReceitaEmitida } from '../../../services/ReceitaService'
import { htmlReceita } from '../receita'

type DetalhesReceitaProps = {
  linha: ReceitaEmitida
  aoVoltar: () => void
  aoImprimir: () => void
  aoAbrirProntuario: () => void
  aoNovo: () => void
}

export function DetalhesReceita({ linha, aoVoltar, aoImprimir, aoAbrirProntuario, aoNovo }: DetalhesReceitaProps) {
  const { paciente, receita, emitidaEm } = linha.snapshot
  return (
    <section className="content-card rx-details">
      <button className="text-back-button" onClick={aoVoltar}>
        ‹ Voltar ao histórico
      </button>
      <h3>Receita de {paciente.nomePet}</h3>
      <p>
        {new Date(emitidaEm).toLocaleString('pt-BR')} · {paciente.veterinario}
      </p>
      <iframe
        className="rx-preview"
        title="Detalhes da receita emitida"
        sandbox=""
        srcDoc={htmlReceita(paciente, receita, new Date(emitidaEm))}
      />
      <div className="form-actions">
        <button className="primary-button" onClick={aoImprimir}>
          PDF / Impressão
        </button>
        <button className="secondary-button" onClick={aoAbrirProntuario}>
          Abrir prontuário
        </button>
        <button className="secondary-button" onClick={aoNovo}>
          Nova receita
        </button>
      </div>
    </section>
  )
}
