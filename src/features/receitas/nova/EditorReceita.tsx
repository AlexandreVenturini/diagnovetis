import type { Receita, ItemReceita } from '../receita'
import { itemReceitaVazio } from '../receita'

type Props = { valor: Receita; aoAlterar: (valor: Receita) => void; ocultarCrmv?: boolean }
const campos: { key: keyof ItemReceita; rotulo: string; placeholder: string }[] = [
  { key: 'medicamento', rotulo: 'Medicamento e apresentação', placeholder: 'Nome, concentração e apresentação' },
  { key: 'dose', rotulo: 'Dose por administração', placeholder: 'Informe a dose e a unidade' },
  { key: 'via', rotulo: 'Via de administração', placeholder: 'Informe a via' },
  { key: 'frequencia', rotulo: 'Frequência', placeholder: 'Informe o intervalo entre as doses' },
  { key: 'duracao', rotulo: 'Duração do tratamento', placeholder: 'Informe a duração' },
  { key: 'quantidade', rotulo: 'Quantidade a dispensar', placeholder: 'Informe a quantidade e a unidade' },
]

export function EditorReceita({ valor, aoAlterar, ocultarCrmv = false }: Props) {
  return (
    <section className="prescription-editor consultation-panel content-card" aria-labelledby="prescription-heading">
      <h2 id="prescription-heading">Receita do animal</h2>
      <p>
        Revise a dose, a via, a frequência, a duração e a quantidade de cada medicamento antes de visualizar e emitir.
      </p>
      {!ocultarCrmv && (
        <div className="consultation-form-grid">
          <label>
            CRMV / UF do veterinário
            <input
              value={valor.crmv}
              onChange={(evento) => aoAlterar({ ...valor, crmv: evento.target.value })}
              placeholder="Número e UF"
            />
          </label>
        </div>
      )}
      {valor.itens.map((item, indice) => (
        <fieldset key={indice}>
          <legend>Medicamento {indice + 1}</legend>
          <div className="consultation-form-grid">
            {campos.map((campo) => (
              <label key={campo.key}>
                {campo.rotulo}
                <input
                  value={item[campo.key]}
                  placeholder={campo.placeholder}
                  onChange={(evento) =>
                    aoAlterar({
                      ...valor,
                      itens: valor.itens.map((atual, i) =>
                        i === indice ? { ...atual, [campo.key]: evento.target.value } : atual,
                      ),
                    })
                  }
                />
              </label>
            ))}
          </div>
          <button
            className="secondary-button"
            type="button"
            disabled={valor.itens.length === 1}
            onClick={() => aoAlterar({ ...valor, itens: valor.itens.filter((_, i) => i !== indice) })}
          >
            Remover medicamento {indice + 1}
          </button>
        </fieldset>
      ))}
      <button
        className="secondary-button"
        type="button"
        onClick={() => aoAlterar({ ...valor, itens: [...valor.itens, itemReceitaVazio()] })}
      >
        + Adicionar medicamento
      </button>
      <div className="consultation-textareas">
        <label>
          Orientações ao tutor
          <textarea
            value={valor.orientacoes}
            onChange={(evento) => aoAlterar({ ...valor, orientacoes: evento.target.value })}
            placeholder="Cuidados e orientações complementares"
          />
        </label>
      </div>
    </section>
  )
}
