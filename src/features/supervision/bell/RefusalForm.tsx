type RefusalFormProps = {
  motivo: string
  busy: boolean
  onChange: (motivo: string) => void
  onConfirm: () => void
  onCancel: () => void
}

export function RefusalForm({ motivo, busy, onChange, onConfirm, onCancel }: RefusalFormProps) {
  return (
    <div className="refusal-form">
      <label>
        Motivo da recusa
        <textarea
          autoFocus
          value={motivo}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Ex.: rever a dose do item 2; incluir a duração do tratamento"
          rows={3}
        />
      </label>
      <div className="refusal-form-actions">
        <button type="button" className="refusal-button" onClick={onCancel} disabled={busy}>
          Voltar
        </button>
        <button
          type="button"
          className="refusal-button refusal-button--confirm"
          onClick={onConfirm}
          disabled={busy || !motivo.trim()}
        >
          Confirmar recusa
        </button>
      </div>
    </div>
  )
}
