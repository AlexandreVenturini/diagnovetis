import { useEffect, useRef, useState } from 'react'
import type { LaudoAnexo } from '../../models/Exame'
import type { RascunhoExame } from './exameTipos'
import { lerArquivoLaudo, validarAnexoLaudo } from './arquivoLaudo'

export function AnexoLaudo({ anexo }: { anexo: LaudoAnexo }) {
  if (validarAnexoLaudo(anexo)) return <p role="alert">Anexo inválido. Substitua o arquivo do laudo.</p>
  return (
    <a className="exam-report-download" href={anexo.dados} download={anexo.nome}>
      Baixar laudo: {anexo.nome}
    </a>
  )
}

export function CamposLaudo({ valor, aoAlterar }: { valor: RascunhoExame; aoAlterar: (valor: RascunhoExame) => void }) {
  const [erro, setErro] = useState('')
  const ultimoValor = useRef({ valor, aoAlterar })
  useEffect(() => {
    ultimoValor.current = { valor, aoAlterar }
  }, [valor, aoAlterar])

  async function anexar(arquivo: File) {
    setErro('')
    aoAlterar({ ...valor, laudoCarregando: true })
    try {
      const anexo = await lerArquivoLaudo(arquivo)
      ultimoValor.current.aoAlterar({ ...ultimoValor.current.valor, laudoAnexo: anexo, laudoCarregando: false })
    } catch (falha) {
      setErro((falha as Error).message)
      ultimoValor.current.aoAlterar({ ...ultimoValor.current.valor, laudoCarregando: false })
    }
  }

  return (
    <fieldset className="full-field exam-report-fields">
      <legend>Laudo do exame</legend>
      <label>
        Texto do laudo (opcional)
        <textarea
          rows={5}
          value={valor.laudo ?? ''}
          onChange={(evento) => aoAlterar({ ...valor, laudo: evento.target.value })}
          placeholder="Digite ou cole o laudo completo do exame"
        />
      </label>
      <label>
        Anexar laudo (somente PDF, até 2 MB)
        <input
          type="file"
          accept="application/pdf"
          disabled={valor.laudoCarregando}
          onChange={(evento) => {
            const arquivo = evento.target.files?.[0]
            evento.target.value = ''
            if (arquivo) void anexar(arquivo)
          }}
        />
      </label>
      {valor.laudoCarregando && <p role="status">Preparando anexo… Aguarde antes de continuar.</p>}
      {valor.laudoAnexo && (
        <div className="exam-report-actions">
          <AnexoLaudo anexo={valor.laudoAnexo} />
          <button
            type="button"
            className="secondary-button"
            disabled={valor.laudoCarregando}
            onClick={() => {
              aoAlterar({ ...valor, laudoAnexo: null })
              setErro('')
            }}
          >
            Remover anexo
          </button>
        </div>
      )}
      <small>
        Envie o PDF emitido pelo laboratório ou pelo setor de imagem. Fotos de exames não são aceitas para não ocupar
        espaço no banco. O texto e o arquivo são salvos ao salvar o exame ou o atendimento.
      </small>
      {erro && <p role="alert">{erro}</p>}
    </fieldset>
  )
}
