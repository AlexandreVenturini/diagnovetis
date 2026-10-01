import { CamposLaudo } from './CamposLaudo'
import { EXAME_STATUS, ROTULOS_STATUS_EXAME } from '../../models/Exame'
import { dataLocal, type RascunhoExame } from './exameTipos'

export function CamposExame({
  valor,
  aoAlterar,
  apenasResultado = false,
}: {
  valor: RascunhoExame
  aoAlterar: (valor: RascunhoExame) => void
  apenasResultado?: boolean
}) {
  return (
    <div className="consultation-form-grid exam-fields">
      {!apenasResultado && (
        <>
          <label>
            Nome do exame
            <input value={valor.nome} onChange={(e) => aoAlterar({ ...valor, nome: e.target.value })} required />
          </label>
          <label>
            Categoria
            <select
              value={valor.categoria}
              onChange={(e) => aoAlterar({ ...valor, categoria: e.target.value as RascunhoExame['categoria'] })}
            >
              <option value="laboratorial">Laboratorial</option>
              <option value="imagem">Imagem</option>
              <option value="outro">Outro</option>
            </select>
          </label>
          <label>
            Data da solicitação
            <input
              type="date"
              max={dataLocal()}
              value={valor.dataSolicitacao}
              onChange={(e) => aoAlterar({ ...valor, dataSolicitacao: e.target.value })}
              required
            />
          </label>
        </>
      )}
      <label>
        Status
        <select
          value={valor.status}
          onChange={(e) => aoAlterar({ ...valor, status: e.target.value as RascunhoExame['status'] })}
        >
          {EXAME_STATUS.map((status) => (
            <option key={status} value={status}>
              {ROTULOS_STATUS_EXAME[status]}
            </option>
          ))}
        </select>
      </label>
      <label>
        Data de realização
        <input
          type="date"
          min={valor.dataSolicitacao}
          max={dataLocal()}
          value={valor.dataRealizacao}
          onChange={(e) => aoAlterar({ ...valor, dataRealizacao: e.target.value })}
          required={valor.status === 'concluido'}
        />
      </label>
      <label className="full-field">
        Resultado
        <textarea
          value={valor.resultado}
          onChange={(e) => aoAlterar({ ...valor, resultado: e.target.value })}
          placeholder="Aguardando resultado"
          required={valor.status === 'concluido'}
        />
      </label>
      <CamposLaudo valor={valor} aoAlterar={aoAlterar} />
      <label className="full-field">
        Interpretação clínica
        <textarea
          value={valor.interpretacao}
          onChange={(e) => aoAlterar({ ...valor, interpretacao: e.target.value })}
          placeholder="Registre a interpretação do profissional responsável"
        />
      </label>
    </div>
  )
}
