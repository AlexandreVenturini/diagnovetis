import { useRef, useState } from 'react'
import { AnexoLaudo } from '../../atendimentos/CamposLaudo'
import { Exame, ROTULOS_STATUS_EXAME } from '../../../models/Exame'
import { ExameService } from '../../../services/ExameService'
import { CamposExame } from '../../atendimentos/CamposExame'
import { exameParaRascunho, type RascunhoExame } from '../../atendimentos/exameTipos'
import type { RegistroClinico } from '../prontuarioTipos'

const servico = new ExameService()
const formatarData = (data: Date | null) => (data ? data.toLocaleDateString('pt-BR') : 'Não informada')
export function ExamesProntuario({
  atendimentos,
  aoSalvo,
  podeEditar = true,
}: {
  atendimentos: RegistroClinico[]
  aoSalvo: (exame: Exame) => void
  podeEditar?: boolean
}) {
  const [editando, setEditando] = useState<{ exame: Exame; rascunho: RascunhoExame } | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const trava = useRef(false)
  async function salvar() {
    if (!editando || trava.current) return
    trava.current = true
    setSalvando(true)
    setMensagem('')
    try {
      const resultado = await servico.atualizarResultado(editando.exame, editando.rascunho)
      aoSalvo(resultado)
      setEditando(null)
      setMensagem('Exame atualizado. Os demais dados da consulta foram preservados.')
    } catch (erro) {
      setMensagem((erro as Error).message)
    } finally {
      trava.current = false
      setSalvando(false)
    }
  }
  const grupos = atendimentos.filter((atendimento) => atendimento.examesComplementares?.length)
  return (
    <div className="record-exams">
      {!grupos.length && <p>Nenhum exame complementar vinculado a este prontuário.</p>}
      {grupos.map((atendimento) => (
        <section key={atendimento.id}>
          <h4>
            Consulta nº {atendimento.id} · {new Date(`${atendimento.data}T12:00:00`).toLocaleDateString('pt-BR')}
          </h4>
          {atendimento.examesComplementares!.map((exame) => (
            <article className="record-exam" key={exame.id}>
              <header>
                <strong>{exame.nomeExame}</strong>
                <span className={`exam-status exam-status-${exame.status}`}>{ROTULOS_STATUS_EXAME[exame.status]}</span>
              </header>
              <dl>
                <div>
                  <dt>Categoria</dt>
                  <dd>
                    {exame.categoria === 'imagem'
                      ? 'Imagem'
                      : exame.categoria === 'laboratorial'
                        ? 'Laboratorial'
                        : 'Outro'}
                  </dd>
                </div>
                <div>
                  <dt>Solicitação</dt>
                  <dd>{formatarData(exame.dataSolicitacao)}</dd>
                </div>
                <div>
                  <dt>Realização</dt>
                  <dd>{formatarData(exame.dataRealizacao)}</dd>
                </div>
              </dl>
              <p>
                <b>Resultado:</b>{' '}
                {exame.resultado || (exame.status === 'cancelado' ? 'Exame cancelado' : 'Aguardando resultado')}
              </p>
              <p>
                <b>Interpretação clínica:</b> {exame.interpretacao || 'Não informada'}
              </p>
              <p>
                <b>Laudo do exame:</b> {exame.laudo || 'Não informado'}
              </p>
              {exame.laudoAnexo && <AnexoLaudo anexo={exame.laudoAnexo} />}
              {editando?.exame.id === exame.id ? (
                <fieldset
                  className="exam-result-editor exam-no-print"
                  disabled={salvando || editando.rascunho.laudoCarregando}
                >
                  <legend>Atualizar acompanhamento / resultado</legend>
                  <CamposExame
                    apenasResultado
                    valor={editando.rascunho}
                    aoAlterar={(rascunho) => setEditando({ ...editando, rascunho })}
                  />
                  <div className="form-actions">
                    <button type="button" className="primary-button" onClick={() => void salvar()}>
                      {salvando ? 'Salvando…' : 'Salvar exame'}
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => {
                        setEditando(null)
                        setMensagem('')
                      }}
                    >
                      Cancelar edição
                    </button>
                  </div>
                </fieldset>
              ) : (
                podeEditar && (
                  <button
                    type="button"
                    className="secondary-button exam-no-print"
                    disabled={salvando}
                    onClick={() => {
                      setEditando({ exame, rascunho: exameParaRascunho(exame) })
                      setMensagem('')
                    }}
                  >
                    Atualizar status / resultado
                  </button>
                )
              )}
            </article>
          ))}
        </section>
      ))}
      {mensagem && (
        <p role="status" className="consultation-message exam-no-print">
          {mensagem}
        </p>
      )}
    </div>
  )
}
