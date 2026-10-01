import type { ReceitaEmitida } from '../../../services/ReceitaService'
import { nomePeriodo, type VisaoPeriodo } from '../../shared/periodo'

type HistoricoReceitasProps = {
  linhas: ReceitaEmitida[]
  visao: VisaoPeriodo
  buscando: boolean
  aoSelecionar: (linha: ReceitaEmitida) => void
}

export function HistoricoReceitas({ linhas, visao, buscando, aoSelecionar }: HistoricoReceitasProps) {
  return (
    <>
      <div className="agenda-list-heading">
        <h3>{buscando ? 'Resultado da busca' : `Receitas ${nomePeriodo(visao)}`}</h3>
        <span>{linhas.length} resultado(s)</span>
      </div>
      <div className="rx-history">
        {!linhas.length && <p>Nenhuma receita encontrada neste período com os filtros selecionados.</p>}
        {linhas.map((linha) => (
          <article className="content-card" key={linha.id}>
            <h3>{linha.snapshot.paciente.nomePet}</h3>
            <p>Tutor: {linha.snapshot.paciente.nomeTutor}</p>
            <p>
              {new Date(linha.snapshot.emitidaEm).toLocaleDateString('pt-BR')} · {linha.snapshot.paciente.veterinario}
            </p>
            <p>{linha.snapshot.receita.itens.map((item) => item.medicamento).join(', ')}</p>
            <button className="outline-button" onClick={() => aoSelecionar(linha)}>
              Ver detalhes
            </button>
          </article>
        ))}
      </div>
    </>
  )
}
