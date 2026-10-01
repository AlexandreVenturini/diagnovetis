import type { RascunhoReceita } from './useRascunhoReceita'

const formatar = (valor: number) => valor.toLocaleString('pt-BR', { maximumSignificantDigits: 8 })

export function CalculadoraDose({ rascunho }: { rascunho: RascunhoReceita }) {
  const { calculo, retornoDose } = rascunho
  return (
    <section className="content-card consultation-panel">
      <h3>3. Calcular dose (opcional)</h3>
      <p>Conversão para soluções em mg/mL. Informe a dose em mg/kg por administração definida pelo veterinário.</p>
      <div className="consultation-form-grid">
        <label>
          Medicamento do cálculo
          <select value={rascunho.itemAlvo} onChange={(evento) => rascunho.selecionarAlvo(Number(evento.target.value))}>
            {rascunho.receita.itens.map((item, indice) => (
              <option key={indice} value={indice}>
                {indice + 1}. {item.medicamento || 'Medicamento sem nome'}
              </option>
            ))}
          </select>
        </label>
        <label>
          Dose (mg/kg por administração)
          <input
            inputMode="decimal"
            value={rascunho.mgKg}
            onChange={(evento) => rascunho.setMgKg(evento.target.value)}
          />
        </label>
        <label>
          Concentração (mg/mL)
          <input
            inputMode="decimal"
            value={rascunho.concentracao}
            onChange={(evento) => rascunho.setConcentracao(evento.target.value)}
          />
        </label>
      </div>
      {calculo && (
        <p>
          {rascunho.peso} kg × {rascunho.mgKg} mg/kg = <strong>{formatar(calculo.mg)} mg</strong> →{' '}
          <strong>{formatar(calculo.ml)} mL por administração</strong>
        </p>
      )}
      <button type="button" className="primary-button rx-dose-apply" onClick={rascunho.aplicarDose}>
        Aplicar dose ao medicamento
      </button>
      {retornoDose && (
        <p
          className={retornoDose.erro ? 'rx-dose-feedback error' : 'rx-dose-feedback'}
          role={retornoDose.erro ? 'alert' : 'status'}
        >
          {retornoDose.texto}
        </p>
      )}
    </section>
  )
}
