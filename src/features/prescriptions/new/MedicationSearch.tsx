import type { Medicamento } from '../../../models/Medicamento'
import type { PrescriptionDraft } from './usePrescriptionDraft'

type MedicationSearchProps = {
  medications: Medicamento[]
  draft: PrescriptionDraft
}

export function MedicationSearch({ medications, draft }: MedicationSearchProps) {
  const query = draft.medQuery.toLocaleLowerCase('pt-BR')
  const matches = medications.filter((item) =>
    `${item.nome} ${item.principioAtivo}`.toLocaleLowerCase('pt-BR').includes(query),
  )
  return (
    <section className="content-card consultation-panel">
      <h3>2. Buscar medicamento</h3>
      <label className="rx-medication-search">
        Nome ou princípio ativo
        <input
          value={draft.medQuery}
          onChange={(event) => draft.setMedQuery(event.target.value)}
          placeholder="Digite para buscar no cadastro"
        />
      </label>
      {draft.medQuery.trim() && (
        <ul className="rx-medications">
          {matches.map((item) => (
            <li key={item.id}>
              <span>
                {item.nome} · {item.concentracao} {item.unidadeConcentracao} · {item.formaFarmaceutica}
              </span>
              <button className="secondary-button" onClick={() => draft.addMedication(item)}>
                Adicionar
              </button>
            </li>
          ))}
        </ul>
      )}
      {!medications.length && <p>Nenhum medicamento cadastrado. Você pode preencher o nome e a apresentação abaixo.</p>}
    </section>
  )
}
