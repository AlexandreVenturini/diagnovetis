import { useEffect, useRef, useState } from 'react'
import type { LaudoAnexo } from '../../models/Exame'
import type { ExamDraft } from './examTypes'
import { readReportFile, validateReportAttachment } from './examReportFile'

export function ExamReportAttachment({ attachment }: { attachment: LaudoAnexo }) {
  if (validateReportAttachment(attachment)) return <p role="alert">Anexo inválido. Substitua o arquivo do laudo.</p>
  return <a className="exam-report-download" href={attachment.dados} download={attachment.nome}>Baixar laudo: {attachment.nome}</a>
}

export function ExamReportFields({ value, onChange }: { value: ExamDraft; onChange: (value: ExamDraft) => void }) {
  const [error, setError] = useState('')
  const latest = useRef({ value, onChange })
  useEffect(() => { latest.current = { value, onChange } }, [value, onChange])

  async function attach(file: File) {
    setError('')
    onChange({ ...value, laudoCarregando: true })
    try {
      const attachment = await readReportFile(file)
      latest.current.onChange({ ...latest.current.value, laudoAnexo: attachment, laudoCarregando: false })
    } catch (failure) {
      setError((failure as Error).message)
      latest.current.onChange({ ...latest.current.value, laudoCarregando: false })
    }
  }

  return <fieldset className="full-field exam-report-fields">
    <legend>Laudo do exame</legend>
    <label>Texto do laudo<textarea rows={5} value={value.laudo ?? ''} onChange={event => onChange({ ...value, laudo: event.target.value })} placeholder="Digite ou cole o laudo completo do exame" /></label>
    <label>Anexar laudo (PDF, JPG ou PNG — até 5 MB)
      <input type="file" accept="application/pdf,image/jpeg,image/png" disabled={value.laudoCarregando} onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void attach(file) }} />
    </label>
    {value.laudoCarregando && <p role="status">Preparando anexo… Aguarde antes de continuar.</p>}
    {value.laudoAnexo && <div className="exam-report-actions"><ExamReportAttachment attachment={value.laudoAnexo} /><button type="button" className="secondary-button" disabled={value.laudoCarregando} onClick={() => { onChange({ ...value, laudoAnexo: null }); setError('') }}>Remover anexo</button></div>}
    <small>O texto e o arquivo serão armazenados ao salvar o exame ou finalizar o atendimento.</small>
    {error && <p role="alert">{error}</p>}
  </fieldset>
}
