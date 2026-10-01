import type { FormEvent } from 'react'
import type { DadosFormularioMedicamento } from './medicamentoTipos'

type FormularioMedicamentoProps = {
  formulario: DadosFormularioMedicamento
  aoAlterar: <K extends keyof DadosFormularioMedicamento>(key: K, valor: DadosFormularioMedicamento[K]) => void
  salvando: boolean
  aoEnviar: (evento: FormEvent<HTMLFormElement>) => void
  aoCancelar: () => void
}

export function FormularioMedicamento({
  formulario,
  aoAlterar,
  salvando,
  aoEnviar,
  aoCancelar,
}: FormularioMedicamentoProps) {
  return (
    <form className="medication-form content-card" onSubmit={aoEnviar}>
      <div>
        <h3>Cadastrar novo medicamento</h3>
        <p>Adicione as informações terapêuticas para consulta da equipe veterinária.</p>
      </div>
      <div className="medication-form-grid">
        <label>
          Nome comercial
          <input
            required
            value={formulario.nomeComercial}
            onChange={(e) => aoAlterar('nomeComercial', e.target.value)}
          />
        </label>
        <label>
          Princípio ativo
          <input
            required
            value={formulario.principioAtivo}
            onChange={(e) => aoAlterar('principioAtivo', e.target.value)}
          />
        </label>
        <label className="full-field">
          Indicações clínicas
          <input
            required
            value={formulario.indicacoes}
            onChange={(e) => aoAlterar('indicacoes', e.target.value)}
            placeholder="Separe por vírgulas"
          />
        </label>
        <label>
          Dosagem exibida
          <input
            required
            value={formulario.dosagem}
            onChange={(e) => aoAlterar('dosagem', e.target.value)}
            placeholder="Ex.: 2 mg/kg"
          />
        </label>
        <label>
          Dose para cálculo (mg/kg)
          <input
            required
            min="0"
            step="0.01"
            type="number"
            value={formulario.doseMgKg || ''}
            onChange={(e) => aoAlterar('doseMgKg', Number(e.target.value))}
          />
        </label>
        <label>
          Frequência
          <input required value={formulario.frequencia} onChange={(e) => aoAlterar('frequencia', e.target.value)} />
        </label>
        <label>
          Via
          <input required value={formulario.via} onChange={(e) => aoAlterar('via', e.target.value)} />
        </label>
        <label>
          Concentração exibida
          <input
            required
            value={formulario.concentracao}
            onChange={(e) => aoAlterar('concentracao', e.target.value)}
            placeholder="Ex.: 30 mg/mL"
          />
        </label>
        <label>
          Concentração líquida (mg/mL, opcional)
          <input
            min="0"
            step="0.01"
            type="number"
            value={formulario.concentracaoMgMl ?? ''}
            onChange={(e) => aoAlterar('concentracaoMgMl', e.target.value ? Number(e.target.value) : null)}
          />
        </label>
        <label className="full-field">
          Contraindicações
          <input
            value={formulario.contraindicacoes}
            onChange={(e) => aoAlterar('contraindicacoes', e.target.value)}
            placeholder="Separe por vírgulas"
          />
        </label>
        <label className="full-field">
          Observações
          <textarea value={formulario.observacoes} onChange={(e) => aoAlterar('observacoes', e.target.value)} />
        </label>
      </div>
      <div className="form-actions">
        <button className="primary-button" type="submit" disabled={salvando}>
          {salvando ? 'Cadastrando...' : 'Cadastrar medicamento'}
        </button>
        <button className="secondary-button" type="button" onClick={aoCancelar} disabled={salvando}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
