import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { DADOS_CLINICOS_VAZIOS, type DadosFormularioCondicao } from './condicaoTipos'
import { FAIXAS_ETARIAS, CATEGORIAS, ETIOLOGIAS, SISTEMAS } from './catalogoClinico'

const formularioVazio = (): DadosFormularioCondicao => ({
  nome: '',
  agente: '',
  risco: 'Médio',
  prevalencia: 'Média',
  hospedeiros: ['Cães'],
  transmissao: '',
  sintomas: [],
  examesSugeridos: [],
  prevencao: [],
  dadosClinicos: structuredClone(DADOS_CLINICOS_VAZIOS),
})
const listar = (texto: string) =>
  texto
    .split('\n')
    .map((valor) => valor.trim())
    .filter(Boolean)

export function FormularioCondicao({
  aoSalvar,
  aoCancelar,
}: {
  aoSalvar: (valor: DadosFormularioCondicao) => Promise<void>
  aoCancelar: () => void
}) {
  const [formulario, setFormulario] = useState(formularioVazio)
  const [textos, setTextos] = useState({
    sintomas: '',
    examesSugeridos: '',
    prevencao: '',
    diferenciais: '',
    protocolos: '',
  })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const trava = useRef(false)
  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (trava.current) return
    trava.current = true
    setSalvando(true)
    setErro('')
    try {
      await aoSalvar({
        ...formulario,
        sintomas: listar(textos.sintomas),
        examesSugeridos: listar(textos.examesSugeridos),
        prevencao: listar(textos.prevencao),
        dadosClinicos: {
          ...formulario.dadosClinicos,
          diferenciais: listar(textos.diferenciais),
          protocolos: listar(textos.protocolos),
        },
      })
      aoCancelar()
    } catch (erro) {
      setErro(
        `${(erro as Error).message} Os campos foram mantidos. Confira se a atualização do banco de condições clínicas foi aplicada.`,
      )
    } finally {
      trava.current = false
      setSalvando(false)
    }
  }
  return (
    <form className="zoonosis-form content-card" onSubmit={enviar}>
      <div className="zoonosis-form-heading">
        <h3>Cadastrar condição clínica</h3>
        <p>Base canina · Preencha as informações revisadas pelo profissional responsável.</p>
      </div>
      <fieldset className="condition-form-fields" disabled={salvando}>
        <div className="zoonosis-form-grid">
          <label>
            Nome da condição
            <input
              required
              value={formulario.nome}
              onChange={(e) => setFormulario({ ...formulario, nome: e.target.value })}
            />
          </label>
          <label>
            Agente etiológico / causa
            <input
              required
              value={formulario.agente}
              onChange={(e) => setFormulario({ ...formulario, agente: e.target.value })}
              placeholder="Informe a causa ou Não definido"
            />
          </label>
          <label>
            Tipo
            <select
              value={formulario.dadosClinicos.tipoCondicao}
              onChange={(e) =>
                setFormulario({
                  ...formulario,
                  dadosClinicos: { ...formulario.dadosClinicos, tipoCondicao: e.target.value },
                })
              }
            >
              {['Doença', 'Síndrome', 'Condição'].map((valor) => (
                <option key={valor}>{valor}</option>
              ))}
            </select>
          </label>
          <label>
            Categoria
            <select
              required
              value={formulario.dadosClinicos.categoria}
              onChange={(e) =>
                setFormulario({
                  ...formulario,
                  dadosClinicos: { ...formulario.dadosClinicos, categoria: e.target.value },
                })
              }
            >
              <option value="">Selecione</option>
              {CATEGORIAS.map((valor) => (
                <option key={valor}>{valor}</option>
              ))}
              <option>Outras</option>
            </select>
          </label>
          <label>
            Etiologia
            <select
              value={formulario.dadosClinicos.etiologia}
              onChange={(e) =>
                setFormulario({
                  ...formulario,
                  dadosClinicos: { ...formulario.dadosClinicos, etiologia: e.target.value },
                })
              }
            >
              <option value="">Não informada</option>
              {ETIOLOGIAS.map((valor) => (
                <option key={valor}>{valor}</option>
              ))}
            </select>
          </label>
          <label>
            Zoonose
            <select
              value={formulario.dadosClinicos.ehZoonose ? 'yes' : 'no'}
              onChange={(e) =>
                setFormulario({
                  ...formulario,
                  dadosClinicos: { ...formulario.dadosClinicos, ehZoonose: e.target.value === 'yes' },
                })
              }
            >
              <option value="yes">Sim</option>
              <option value="no">Não</option>
            </select>
          </label>
          <label>
            Nível de risco
            <select
              value={formulario.risco}
              onChange={(e) =>
                setFormulario({ ...formulario, risco: e.target.value as DadosFormularioCondicao['risco'] })
              }
            >
              <option>Alto</option>
              <option>Médio</option>
              <option>Baixo</option>
            </select>
          </label>
          <label>
            Transmissão
            <textarea
              value={formulario.transmissao}
              onChange={(e) => setFormulario({ ...formulario, transmissao: e.target.value })}
            />
          </label>
          <fieldset className="condition-checkboxes full-field">
            <legend>Sistemas envolvidos</legend>
            {SISTEMAS.map((valor) => (
              <label key={valor}>
                <input
                  type="checkbox"
                  checked={formulario.dadosClinicos.sistemas.includes(valor)}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      dadosClinicos: {
                        ...formulario.dadosClinicos,
                        sistemas: e.target.checked
                          ? [...formulario.dadosClinicos.sistemas, valor]
                          : formulario.dadosClinicos.sistemas.filter((item) => item !== valor),
                      },
                    })
                  }
                />
                {valor}
              </label>
            ))}
          </fieldset>
          <fieldset className="condition-checkboxes full-field">
            <legend>Faixas etárias</legend>
            {FAIXAS_ETARIAS.map((valor) => (
              <label key={valor}>
                <input
                  type="checkbox"
                  checked={formulario.dadosClinicos.faixasEtarias.includes(valor)}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      dadosClinicos: {
                        ...formulario.dadosClinicos,
                        faixasEtarias: e.target.checked
                          ? [...formulario.dadosClinicos.faixasEtarias, valor]
                          : formulario.dadosClinicos.faixasEtarias.filter((item) => item !== valor),
                      },
                    })
                  }
                />
                {valor}
              </label>
            ))}
          </fieldset>
          {(
            [
              { key: 'sintomas', rotulo: 'Sinais clínicos', obrigatorio: true },
              { key: 'examesSugeridos', rotulo: 'Exames sugeridos' },
              { key: 'diferenciais', rotulo: 'Diagnósticos diferenciais' },
              { key: 'prevencao', rotulo: 'Prevenção e controle', obrigatorio: true },
              { key: 'protocolos', rotulo: 'Protocolos vinculados / condutas' },
            ] as const
          ).map((campo) => (
            <label key={campo.key}>
              {campo.rotulo}
              <textarea
                required={'obrigatorio' in campo && campo.obrigatorio}
                placeholder="Um item por linha"
                value={textos[campo.key]}
                onChange={(e) => setTextos({ ...textos, [campo.key]: e.target.value })}
              />
            </label>
          ))}
          <label>
            Alerta clínico / revisão pendente
            <textarea
              value={formulario.dadosClinicos.alerta}
              onChange={(e) =>
                setFormulario({ ...formulario, dadosClinicos: { ...formulario.dadosClinicos, alerta: e.target.value } })
              }
              placeholder="Deixe vazio se não houver alerta"
            />
          </label>
        </div>
        <div className="form-actions">
          <button className="primary-button" type="submit">
            {salvando ? 'Salvando…' : 'Salvar condição'}
          </button>
          <button className="secondary-button" type="button" onClick={aoCancelar}>
            Cancelar
          </button>
        </div>
      </fieldset>
      {erro && (
        <p role="alert" className="consultation-message">
          {erro}
        </p>
      )}
    </form>
  )
}
