import type { ExamDraft } from './examTypes'
import { EXAME_STATUS_LABEL } from '../../models/Exame'
import type { ConsultationData } from './consultationTypes'
import consultationPrintCss from './print/consultation-print.css?raw'

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function valueOrFallback(value: string, fallback = 'Não informado') {
  return escapeHtml(value.trim() || fallback)
}

function reportField(label: string, value: string) {
  return `<div class="field"><span>${label}</span><strong>${valueOrFallback(value)}</strong></div>`
}

export function generateConsultationReport(data: ConsultationData, exams: ExamDraft[] = []) {
  const reportWindow = window.open('', '_blank', 'width=900,height=800')
  if (!reportWindow) return false

  const issuedAt = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date())

  const examBlock = (exam: ExamDraft) => `
        <div class="long-text">
          <b>${valueOrFallback(exam.nome)}</b>
          <p>${valueOrFallback(exam.categoria)} · Solicitação: ${valueOrFallback(exam.dataSolicitacao)} · ${EXAME_STATUS_LABEL[exam.status]}</p>
          <p>Realização: ${valueOrFallback(exam.dataRealizacao)}</p>
          <p>Resultado: ${valueOrFallback(exam.resultado, 'Aguardando resultado')}</p>
          <p>Laudo: ${valueOrFallback(exam.laudo ?? '')}</p>
          ${exam.laudoAnexo ? `<p>Anexo do laudo: ${valueOrFallback(exam.laudoAnexo.nome)} (disponível no prontuário)</p>` : ''}
          <p>Interpretação: ${valueOrFallback(exam.interpretacao)}</p>
        </div>`
  const withUnit = (value: string, unit: string) => (value ? `${value} ${unit}` : '')

  const documentContent = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Relatório Clínico - ${valueOrFallback(data.dogName, 'Paciente')}</title>
  <style>${consultationPrintCss}</style>
</head>
<body>
  <main class="page">
    <header class="header">
      <div class="brand">
        <div class="mark">✚</div>
        <div>
          <h1>DiagnoVetis</h1>
          <p>IFES Santa Teresa · Sistema de Gestão Veterinária</p>
        </div>
      </div>
      <div class="report-meta">
        <strong>Relatório de Atendimento Clínico</strong>
        <span>Emitido em ${escapeHtml(issuedAt)}</span>
      </div>
    </header>
    <div class="notice">Documento clínico destinado ao acompanhamento veterinário do paciente.</div>

    <section>
      <h2>1. Identificação do Paciente</h2>
      <div class="grid">
        ${reportField('Nome do cão', data.dogName)}
        ${reportField('Idade', data.age)}
        ${reportField('Raça', data.breed)}
        ${reportField('Tutor responsável', data.tutorName)}
        ${reportField('Veterinário responsável', data.veterinarian)}
      </div>
    </section>

    <section>
      <h2>2. Histórico Clínico</h2>
      <div class="long-text"><span>Queixa principal</span><p>${valueOrFallback(data.mainComplaint)}</p></div>
      <div class="long-text long-text--spaced"><span>Histórico do animal</span><p>${valueOrFallback(data.history)}</p></div>
    </section>

    <section>
      <h2>3. Exame Físico</h2>
      <div class="grid four">
        ${reportField('Mucosas', data.mucosa)}
        ${reportField('TPC', data.capillaryRefill)}
        ${reportField('Frequência cardíaca', withUnit(data.heartRate, 'bpm'))}
        ${reportField('Frequência respiratória', withUnit(data.respiratoryRate, 'mpm'))}
        ${reportField('Temperatura', withUnit(data.temperature, '°C'))}
        ${reportField('Hidratação', data.hydration)}
        ${reportField('Nível de consciência', data.consciousness)}
      </div>
    </section>

    <section>
      <h2>4. Avaliação e Conduta</h2>
      <div class="grid">
        ${reportField('Diagnóstico clínico', data.diagnosis ?? '')}
        ${reportField('Suspeita / zoonose pesquisada', data.zoonosisSearch)}
      </div>
      <div class="long-text long-text--spaced"><span>Observações e conduta terapêutica</span><p>${valueOrFallback(data.conduct)}</p></div>
    </section>

    <section>
      <h2>Exames complementares</h2>
      ${exams.length ? exams.map(examBlock).join('') : '<p>Nenhum exame solicitado.</p>'}
    </section>
    <div class="signatures">
      <div class="signature">
        <strong>${valueOrFallback(data.veterinarian, 'Veterinário responsável')}</strong>
        <span>Assinatura e CRMV</span>
      </div>
      <div class="signature">
        <strong>${valueOrFallback(data.tutorName, 'Tutor responsável')}</strong>
        <span>Assinatura do responsável</span>
      </div>
    </div>
    <footer>DiagnoVetis · IFES Campus Santa Teresa · Relatório gerado eletronicamente pelo sistema</footer>
  </main>
  <div class="actions">
    <button class="close" onclick="window.close()">Fechar</button>
    <button class="print" onclick="window.print()">Imprimir / Salvar PDF</button>
  </div>
</body>
</html>`

  reportWindow.document.open()
  reportWindow.document.write(documentContent)
  reportWindow.document.close()
  return true
}
