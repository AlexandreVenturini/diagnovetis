import { CamposEspecificos } from './CamposEspecificos'
import { CamposLaudo } from './CamposLaudo'
import { resumirResultado } from './catalogoExames'
import { EXAME_STATUS, ROTULOS_STATUS_EXAME } from '../../models/Exame'
import { dataLocal, modeloDoRascunho, type RascunhoExame } from './exameTipos'

export function CamposExame({
  valor,
  aoAlterar,
  apenasResultado = false,
}: {
  valor: RascunhoExame
  aoAlterar: (valor: RascunhoExame) => void
  apenasResultado?: boolean
}) {
  const modelo = modeloDoRascunho(valor)
  const resumoSugerido = resumirResultado(modelo, valor.dados)
  return (
    <div className="consultation-form-grid exam-fields">
      {!apenasResultado && !modelo && (
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
        </>
      )}
      {!apenasResultado && (
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
      {modelo && (
        <CamposEspecificos
          modelo={modelo}
          dados={valor.dados ?? {}}
          aoAlterar={(dados) => aoAlterar({ ...valor, dados })}
        />
      )}
      <div className="full-field exam-summary">
        <label>
          Resumo do resultado
          <textarea
            rows={2}
            value={valor.resultado}
            onChange={(e) => aoAlterar({ ...valor, resultado: e.target.value })}
            placeholder="Ex.: anemia leve e creatinina aumentada. Aparece na ficha do prontuário."
            required={valor.status === 'concluido'}
          />
        </label>
        {resumoSugerido && resumoSugerido !== valor.resultado && (
          <button
            type="button"
            className="outline-button"
            onClick={() => aoAlterar({ ...valor, resultado: resumoSugerido })}
          >
            Preencher com os valores informados
          </button>
        )}
      </div>
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
