import { useState } from 'react'
import { IconeCalculadora, IconeComprimido } from './IconesMedicamento'
import type { MedicamentoResumo } from './medicamentoTipos'

const formatarNumero = (valor: number) => valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 })

function calcularDose(medicamento: MedicamentoResumo, peso: string) {
  const kg = Number(peso.replace(',', '.'))
  if (!kg || kg <= 0) return 'Informe um peso válido.'
  const mg = kg * medicamento.doseMgKg
  const volume = medicamento.concentracaoMgMl ? ` (${formatarNumero(mg / medicamento.concentracaoMgMl)} mL)` : ''
  return `${formatarNumero(mg)} mg por administração${volume}`
}

function ListaItens({ itens }: { itens: string[] }) {
  return (
    <ul>
      {itens.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

export function DetalhesMedicamento({ medicamento }: { medicamento: MedicamentoResumo | null }) {
  const [peso, setPeso] = useState('')
  const [resultado, setResultado] = useState<string | null>(null)

  if (!medicamento)
    return (
      <aside className="medication-details empty">
        <IconeComprimido />
        <p>Selecione um medicamento ao lado para ver os detalhes e calcular a dose</p>
      </aside>
    )

  return (
    <aside className="medication-details" key={medicamento.id}>
      <h3>{medicamento.nomeComercial}</h3>
      <p className="active-ingredient">{medicamento.principioAtivo}</p>
      <div className="medication-summary">
        <p>
          <b>Dosagem:</b> {medicamento.dosagem}
        </p>
        <p>
          <b>Frequência:</b> {medicamento.frequencia}
        </p>
        <p>
          <b>Via:</b> {medicamento.via}
        </p>
        <p>
          <b>Concentração:</b> {medicamento.concentracao}
        </p>
      </div>
      <section className="medication-section">
        <h4>Indicações Clínicas</h4>
        <ListaItens itens={medicamento.indicacoes} />
      </section>
      {medicamento.contraindicacoes.length > 0 && (
        <section className="medication-alert">
          <h4>
            <span>△</span>Contraindicações
          </h4>
          <ListaItens itens={medicamento.contraindicacoes} />
        </section>
      )}
      <section className="medication-notes">
        <h4>Observações</h4>
        <p>{medicamento.observacoes || 'Sem observações adicionais.'}</p>
      </section>
      <section className="dose-calculator">
        <h4>
          <IconeCalculadora />
          Calculadora de Dose
        </h4>
        <label>
          Peso do Animal (kg)
          <input
            inputMode="decimal"
            value={peso}
            onChange={(evento) => {
              setPeso(evento.target.value)
              setResultado(null)
            }}
            placeholder="Ex: 25.5"
          />
        </label>
        <button type="button" onClick={() => setResultado(calcularDose(medicamento, peso))}>
          <IconeCalculadora />
          Calcular Dose
        </button>
        {resultado && <output>{resultado}</output>}
      </section>
    </aside>
  )
}
