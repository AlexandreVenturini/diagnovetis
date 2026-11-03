import type { DadosExame } from '../../models/Exame'
import { situacaoValor, textoReferencia, type CampoEspecifico, type ModeloExame } from './catalogoExames'

const ROTULO_SITUACAO = { abaixo: '↓ Abaixo da referência', acima: '↑ Acima da referência' } as const

function Campo({
  campo,
  valor,
  aoAlterar,
}: {
  campo: CampoEspecifico
  valor: string | string[] | undefined
  aoAlterar: (valor: string | string[]) => void
}) {
  if (campo.tipo === 'multiplo') {
    const marcados = Array.isArray(valor) ? valor : []
    return (
      <fieldset className="exam-specific-multiple full-field">
        <legend>{campo.rotulo}</legend>
        {campo.opcoes.map((opcao) => (
          <label key={opcao}>
            <input
              type="checkbox"
              checked={marcados.includes(opcao)}
              onChange={(evento) =>
                aoAlterar(
                  evento.target.checked ? [...marcados, opcao] : marcados.filter((marcado) => marcado !== opcao),
                )
              }
            />
            {opcao}
          </label>
        ))}
      </fieldset>
    )
  }
  const atual = typeof valor === 'string' ? valor : ''
  if (campo.tipo === 'opcoes')
    return (
      <label>
        {campo.rotulo}
        <select value={atual} onChange={(evento) => aoAlterar(evento.target.value)}>
          <option value="">Não informado</option>
          {campo.opcoes.map((opcao) => (
            <option key={opcao}>{opcao}</option>
          ))}
        </select>
      </label>
    )
  if (campo.tipo === 'texto')
    return (
      <label className={campo.longo ? 'full-field' : undefined}>
        {campo.rotulo}
        {campo.longo ? (
          <textarea rows={3} value={atual} onChange={(evento) => aoAlterar(evento.target.value)} />
        ) : (
          <input value={atual} onChange={(evento) => aoAlterar(evento.target.value)} />
        )}
      </label>
    )
  const situacao = situacaoValor(campo, atual)
  const referencia = textoReferencia(campo)
  return (
    <label className={situacao ? `exam-specific-number exam-value-${situacao}` : 'exam-specific-number'}>
      {campo.rotulo}
      <span className="exam-specific-input">
        <input
          type="number"
          step="any"
          inputMode="decimal"
          value={atual}
          onChange={(evento) => aoAlterar(evento.target.value)}
        />
        {campo.unidade && <span>{campo.unidade}</span>}
      </span>
      {(referencia || situacao) && (
        <small>
          {referencia && `Referência: ${referencia}`}
          {situacao && <b> {ROTULO_SITUACAO[situacao]}</b>}
        </small>
      )}
    </label>
  )
}

export function CamposEspecificos({
  modelo,
  dados,
  aoAlterar,
}: {
  modelo: ModeloExame
  dados: DadosExame
  aoAlterar: (dados: DadosExame) => void
}) {
  const temReferencia = modelo.secoes.some((secao) =>
    secao.campos.some((campo) => campo.tipo === 'numero' && campo.referencia),
  )
  return (
    <fieldset className="full-field exam-specific-fields">
      <legend>Resultados: {modelo.nome}</legend>
      {temReferencia && (
        <p className="exam-specific-note">
          Referências aproximadas para cães adultos. Confira sempre os valores do laboratório que emitiu o laudo.
        </p>
      )}
      {modelo.secoes.map((secao, indice) => (
        <section key={secao.titulo ?? indice} className="exam-specific-section">
          {secao.titulo && <h4>{secao.titulo}</h4>}
          <div className="consultation-form-grid exam-specific-grid">
            {secao.campos.map((campo) => (
              <Campo
                key={campo.chave}
                campo={campo}
                valor={dados[campo.chave]}
                aoAlterar={(valor) => aoAlterar({ ...dados, [campo.chave]: valor })}
              />
            ))}
          </div>
        </section>
      ))}
    </fieldset>
  )
}
