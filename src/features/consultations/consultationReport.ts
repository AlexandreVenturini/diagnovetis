import type { ExamDraft } from './examTypes'
import { EXAME_STATUS_LABEL } from '../../models/Exame'
import type { ConsultationData } from './consultationTypes'

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

  const documentContent = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Relatório Clínico - ${valueOrFallback(data.dogName, 'Paciente')}</title>
  <style>
    * { box-sizing: border-box; }
    @page { size: A4; margin: 16mm; }
    body { margin: 0; color: #202520; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 1.45; background: #eef2ef; }
    .page { width: 210mm; min-height: 297mm; margin: 20px auto; padding: 16mm; background: #fff; box-shadow: 0 5px 24px rgba(0,0,0,.12); }
    .header { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding-bottom: 16px; border-bottom: 3px solid #287642; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .mark { width: 47px; height: 47px; display: grid; place-items: center; border-radius: 50%; background: #287642; color: #fff; font-size: 24px; font-weight: bold; }
    .brand h1 { margin: 0; color: #176534; font-size: 23px; }.brand p { margin: 3px 0 0; font-size: 11px; }
    .report-meta { text-align: right; }.report-meta strong { display: block; color: #176534; font-size: 15px; }.report-meta span { display: block; margin-top: 4px; color: #606760; font-size: 10px; }
    .notice { margin: 16px 0; padding: 10px 12px; border: 1px solid #a8c9b1; border-radius: 6px; background: #edf6ef; color: #245d34; }
    section { margin-top: 17px; page-break-inside: avoid; }
    h2 { margin: 0 0 10px; padding-bottom: 6px; border-bottom: 1px solid #cfd8d1; color: #176534; font-size: 14px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 9px 24px; }
    .grid.four { grid-template-columns: 1fr 1fr 1fr; }
    .field { min-height: 39px; padding: 7px 9px; border: 1px solid #dce2dd; border-radius: 5px; background: #fafcfb; }
    .field span { display: block; margin-bottom: 3px; color: #667068; font-size: 9px; text-transform: uppercase; letter-spacing: .35px; }
    .field strong { display: block; font-size: 11px; font-weight: 600; white-space: pre-wrap; }
    .long-text { min-height: 62px; padding: 9px 11px; border: 1px solid #dce2dd; border-radius: 5px; white-space: pre-wrap; }
    .long-text span { display: block; margin-bottom: 5px; color: #667068; font-size: 9px; text-transform: uppercase; }.long-text p { margin: 0; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 45px; margin-top: 55px; text-align: center; }
    .signature { padding-top: 7px; border-top: 1px solid #555; }.signature strong { display: block; }.signature span { color: #666; font-size: 10px; }
    footer { margin-top: 30px; padding-top: 9px; border-top: 1px solid #d7ddd8; color: #737a74; font-size: 9px; text-align: center; }
    .actions { position: fixed; right: 25px; bottom: 25px; display: flex; gap: 8px; }.actions button { padding: 11px 17px; border: 0; border-radius: 7px; color: #fff; font-weight: bold; cursor: pointer; }.print { background: #287642; }.close { background: #555; }
    @media print { body { background: #fff; }.page { width: auto; min-height: auto; margin: 0; padding: 0; box-shadow: none; }.actions { display: none; } }
    @media (max-width: 800px) { .page { width: 100%; min-height: 100vh; margin: 0; padding: 24px; }.grid,.grid.four { grid-template-columns: 1fr; }.actions { position: static; justify-content: center; padding: 15px; background: #fff; } }
  </style>
</head>
<body>
  <main class="page">
    <header class="header">
      <div class="brand"><div class="mark">✚</div><div><h1>DiagnoVetis</h1><p>IFES Santa Teresa · Sistema de Gestão Veterinária</p></div></div>
      <div class="report-meta"><strong>Relatório de Atendimento Clínico</strong><span>Emitido em ${escapeHtml(issuedAt)}</span></div>
    </header>
    <div class="notice">Documento clínico destinado ao acompanhamento veterinário do paciente.</div>

    <section><h2>1. Identificação do Paciente</h2><div class="grid">
      ${reportField('Nome do cão', data.dogName)}${reportField('Idade', data.age)}${reportField('Raça', data.breed)}${reportField('Tutor responsável', data.tutorName)}${reportField('Veterinário responsável', data.veterinarian)}
    </div></section>

    <section><h2>2. Histórico Clínico</h2>
      <div class="long-text"><span>Queixa principal</span><p>${valueOrFallback(data.mainComplaint)}</p></div>
      <div class="long-text" style="margin-top:8px"><span>Histórico do animal</span><p>${valueOrFallback(data.history)}</p></div>
    </section>

    <section><h2>3. Exame Físico</h2><div class="grid four">
      ${reportField('Mucosas', data.mucosa)}${reportField('TPC', data.capillaryRefill)}${reportField('Frequência cardíaca', data.heartRate ? `${data.heartRate} bpm` : '')}${reportField('Frequência respiratória', data.respiratoryRate ? `${data.respiratoryRate} mpm` : '')}${reportField('Temperatura', data.temperature ? `${data.temperature} °C` : '')}${reportField('Hidratação', data.hydration)}${reportField('Nível de consciência', data.consciousness)}
    </div></section>

    <section><h2>4. Avaliação e Conduta</h2>
      <div class="grid">${reportField('Diagnóstico clínico', data.diagnosis ?? '')}${reportField('Suspeita / zoonose pesquisada', data.zoonosisSearch)}</div>
      <div class="long-text" style="margin-top:8px"><span>Observações e conduta terapêutica</span><p>${valueOrFallback(data.conduct)}</p></div>
    </section>

    <section><h2>Exames complementares</h2>
      ${exams.length ? exams.map(exam => `<div class="long-text"><b>${valueOrFallback(exam.nome)}</b><p>${valueOrFallback(exam.categoria)} · Solicitação: ${valueOrFallback(exam.dataSolicitacao)} · ${EXAME_STATUS_LABEL[exam.status]}</p><p>Realização: ${valueOrFallback(exam.dataRealizacao)}</p><p>Resultado: ${valueOrFallback(exam.resultado, 'Aguardando resultado')}</p><p>Laudo: ${valueOrFallback(exam.laudo ?? '')}</p>${exam.laudoAnexo ? `<p>Anexo do laudo: ${valueOrFallback(exam.laudoAnexo.nome)} (disponível no prontuário)</p>` : ''}<p>Interpretação: ${valueOrFallback(exam.interpretacao)}</p></div>`).join('') : '<p>Nenhum exame solicitado.</p>'}
    </section>
    <div class="signatures"><div class="signature"><strong>${valueOrFallback(data.veterinarian, 'Veterinário responsável')}</strong><span>Assinatura e CRMV</span></div><div class="signature"><strong>${valueOrFallback(data.tutorName, 'Tutor responsável')}</strong><span>Assinatura do responsável</span></div></div>
    <footer>DiagnoVetis · IFES Campus Santa Teresa · Relatório gerado eletronicamente pelo sistema</footer>
  </main>
  <div class="actions"><button class="close" onclick="window.close()">Fechar</button><button class="print" onclick="window.print()">Imprimir / Salvar PDF</button></div>
</body>
</html>`

  reportWindow.document.open()
  reportWindow.document.write(documentContent)
  reportWindow.document.close()
  return true
}
