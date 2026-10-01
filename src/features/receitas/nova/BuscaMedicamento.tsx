import type { Medicamento } from '../../../models/Medicamento'
import type { RascunhoReceita } from './useRascunhoReceita'

type BuscaMedicamentoProps = {
  medicamentos: Medicamento[]
  rascunho: RascunhoReceita
}

export function BuscaMedicamento({ medicamentos, rascunho }: BuscaMedicamentoProps) {
  const busca = rascunho.buscaMedicamento.toLocaleLowerCase('pt-BR')
  const correspondencias = medicamentos.filter((item) =>
    `${item.nome} ${item.principioAtivo}`.toLocaleLowerCase('pt-BR').includes(busca),
  )
  return (
    <section className="content-card consultation-panel">
      <h3>2. Buscar medicamento</h3>
      <label className="rx-medication-search">
        Nome ou princípio ativo
        <input
          value={rascunho.buscaMedicamento}
          onChange={(evento) => rascunho.setBuscaMedicamento(evento.target.value)}
          placeholder="Digite para buscar no cadastro"
        />
      </label>
      {rascunho.buscaMedicamento.trim() && (
        <ul className="rx-medications">
          {correspondencias.map((item) => (
            <li key={item.id}>
              <span>
                {item.nome} · {item.concentracao} {item.unidadeConcentracao} · {item.formaFarmaceutica}
              </span>
              <button className="secondary-button" onClick={() => rascunho.adicionarMedicamento(item)}>
                Adicionar
              </button>
            </li>
          ))}
        </ul>
      )}
      {!medicamentos.length && (
        <p>Nenhum medicamento cadastrado. Você pode preencher o nome e a apresentação abaixo.</p>
      )}
    </section>
  )
}
