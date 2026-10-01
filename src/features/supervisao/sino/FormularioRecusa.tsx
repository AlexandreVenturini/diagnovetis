type FormularioRecusaProps = {
  motivo: string
  ocupado: boolean
  aoAlterar: (motivo: string) => void
  aoConfirmar: () => void
  aoCancelar: () => void
}

export function FormularioRecusa({ motivo, ocupado, aoAlterar, aoConfirmar, aoCancelar }: FormularioRecusaProps) {
  return (
    <div className="refusal-form">
      <label>
        Motivo da recusa
        <textarea
          autoFocus
          value={motivo}
          onChange={(evento) => aoAlterar(evento.target.value)}
          placeholder="Ex.: rever a dose do item 2; incluir a duração do tratamento"
          rows={3}
        />
      </label>
      <div className="refusal-form-actions">
        <button type="button" className="refusal-button" onClick={aoCancelar} disabled={ocupado}>
          Voltar
        </button>
        <button
          type="button"
          className="refusal-button refusal-button--confirm"
          onClick={aoConfirmar}
          disabled={ocupado || !motivo.trim()}
        >
          Confirmar recusa
        </button>
      </div>
    </div>
  )
}
