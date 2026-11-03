import type { DadosExame } from '../../models/Exame'
import { situacaoValor, textoReferencia, valorFormatado, valorPreenchido, type ModeloExame } from './catalogoExames'

export function ResultadoEspecifico({ modelo, dados }: { modelo: ModeloExame; dados: DadosExame }) {
  const secoes = modelo.secoes
    .map((secao) => ({ ...secao, campos: secao.campos.filter((campo) => valorPreenchido(dados[campo.chave])) }))
    .filter((secao) => secao.campos.length)
  if (!secoes.length) return null
  return (
    <div className="exam-specific-result">
      {secoes.map((secao, indice) => (
        <table key={secao.titulo ?? indice}>
          {secao.titulo && <caption>{secao.titulo}</caption>}
          <tbody>
            {secao.campos.map((campo) => {
              const situacao = situacaoValor(campo, dados[campo.chave])
              const referencia = textoReferencia(campo)
              return (
                <tr key={campo.chave} className={situacao ? `exam-value-${situacao}` : undefined}>
                  <th scope="row">{campo.rotulo}</th>
                  <td>
                    {valorFormatado(campo, dados[campo.chave])}
                    {situacao && <b> {situacao === 'acima' ? '↑' : '↓'}</b>}
                  </td>
                  <td>{referencia && `Ref.: ${referencia}`}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      ))}
    </div>
  )
}
