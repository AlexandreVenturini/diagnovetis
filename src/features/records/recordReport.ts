function escapeHtml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;')
}

function printableValue(control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) {
  const output = document.createElement('span')
  output.className = 'printable-value'
  if (control instanceof HTMLInputElement && control.type === 'checkbox') {
    output.className += ' printable-checkbox'
    output.textContent = control.checked ? '☒' : '☐'
  } else if (control instanceof HTMLSelectElement) {
    output.textContent = control.selectedOptions[0]?.textContent ?? ''
  } else if (control instanceof HTMLInputElement && control.type === 'date' && control.value) {
    output.textContent = new Date(`${control.value}T12:00:00`).toLocaleDateString('pt-BR')
  } else output.textContent = control.value
  return output
}

export function exportPatientRecord(form: HTMLFormElement, dogName: string) {
  const reportWindow = window.open('', '_blank', 'width=1100,height=900')
  if (!reportWindow) return false

  const printableForm = form.cloneNode(true) as HTMLFormElement
  printableForm.querySelectorAll('.paper-section-actions').forEach((element) => element.remove())
  printableForm.querySelectorAll('.paper-section.collapsed').forEach((section) => section.remove())
  printableForm.querySelectorAll('.paper-section').forEach((section) => {
    if (section.querySelector('table')) section.classList.add('table-section')
  })
  const sourceControls = Array.from(form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input, textarea, select'))
  const clonedControls = Array.from(printableForm.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input, textarea, select'))
  clonedControls.forEach((control, index) => control.replaceWith(printableValue(sourceControls[index] ?? control)))

  reportWindow.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Prontuário - ${escapeHtml(dogName)}</title><style>
*{box-sizing:border-box}@page{size:A4 portrait;margin:8mm}html,body{margin:0;padding:0}body{background:#e8eeeb;color:#183d39;font:9px/1.3 Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.animal-record-form{width:194mm;margin:10px auto;padding:5mm;border:1.5px solid #16665f;border-radius:6px;background:#fff;box-shadow:0 4px 18px #0002}.animal-record-title{min-height:18mm;display:grid;grid-template-columns:13mm 1fr 38mm;align-items:center;gap:3mm;padding:0 2mm 3mm}.record-logo{width:11mm;height:11mm;display:grid;place-items:center;border-radius:2mm;background:#075a56;color:#fff;font-size:20px;font-weight:700;box-shadow:1.5mm 1.5mm 0 #d8eae7}.animal-record-title h3{margin:0;color:#07524e;font-size:18px;text-transform:uppercase}.animal-record-title p{margin:1mm 0 0;color:#315a57;font-size:8px}.animal-record-title label{display:flex;flex-direction:column;gap:2mm;padding:2mm;border:1px solid #2c7771;border-radius:2mm;font-size:7px;font-weight:700}.animal-record-title .printable-value{min-height:5mm}
.animal-record-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:2mm}.paper-section{min-width:0;grid-column:span 3;display:flex;flex-direction:column;margin:0;padding:3mm 2mm 2mm;border:1px solid #27756f;border-radius:1.5mm;break-inside:avoid;page-break-inside:avoid}.paper-section.third{grid-column:span 2}.paper-section.two-thirds{grid-column:span 4}.paper-section.full{grid-column:1/-1}.paper-section legend{width:calc(100% + 4mm);margin-left:-2mm;padding:1.5mm 2mm;border-bottom:1px solid #27756f;background:#edf7f5;color:#125b56;font-size:8px;font-weight:800;text-transform:uppercase}.paper-section legend b{color:#08716a}
.paper-fields{display:grid;grid-template-columns:1fr 1fr;gap:1.5mm 3mm}.paper-fields.single{grid-template-columns:1fr}.paper-fields.compact{gap:1mm;margin-top:2mm}.paper-fields label,.paper-textarea{min-width:0;display:flex;align-items:flex-end;gap:1mm;color:#263c39;font-size:7px;white-space:nowrap}.paper-fields label.wide{grid-column:1/-1}.paper-textarea{flex-direction:column;align-items:stretch;white-space:normal}.paper-section>.paper-textarea{flex:1}.paper-section>.paper-textarea .printable-value{height:100%;min-height:20mm}.paper-section.third>.paper-fields.single:not(.compact){flex:1;grid-auto-rows:1fr}.paper-section.third>.paper-fields.single:not(.compact) label{align-items:stretch}.printable-value{min-width:0;min-height:4.5mm;flex:1;padding:.7mm;border-bottom:1px solid #899b98;color:#172d2a;white-space:pre-wrap;overflow-wrap:anywhere}.printable-checkbox{min-height:0;flex:0;border:0;padding:0;font-size:10px}
table{width:100%;border-collapse:collapse;color:#273d3a;font-size:7px}thead{display:table-header-group}tr{break-inside:avoid;page-break-inside:avoid}th,td{height:6mm;padding:1mm;border:1px solid #aab8b6;text-align:left;vertical-align:top}th{background:#e8f4f2;color:#164f4b;font-weight:800}td .printable-value{display:block;min-height:4mm;border:0;padding:0}.physical-exam-grid{display:grid;grid-template-columns:repeat(3,1fr)}.physical-exam-grid>div{padding:0 2mm}.physical-exam-grid>div+div{border-left:1px solid #9badaa}.check-list{display:grid;grid-template-columns:1fr 1fr;gap:1.5mm;margin-bottom:2mm}.check-list label{display:flex;align-items:center;gap:1mm;font-size:7px}.animal-record-footer{margin:2mm auto 0;padding:1.5mm;border:1px solid #27756f;border-radius:3mm;color:#12605b;font-size:7px;font-weight:800;letter-spacing:1.5px;text-align:center;text-transform:uppercase}
.actions{position:fixed;right:20px;bottom:20px;display:flex;gap:8px}.actions button{padding:11px 16px;border:0;border-radius:7px;color:#fff;font-weight:700;cursor:pointer}.print{background:#287642}.close{background:#555}@media print{body{background:#fff}.animal-record-form{width:auto;margin:0;padding:0;border:0;box-shadow:none}.actions{display:none}.paper-section.table-section{break-inside:auto;page-break-inside:auto}}@media screen and (max-width:850px){.animal-record-form{width:100%;margin:0}.animal-record-grid{grid-template-columns:1fr}.paper-section,.paper-section.third,.paper-section.two-thirds,.paper-section.full{grid-column:1}.animal-record-title{grid-template-columns:13mm 1fr}.animal-record-title label{grid-column:1/-1}}
</style></head><body>${printableForm.outerHTML}<div class="actions"><button class="close" onclick="window.close()">Fechar</button><button class="print" onclick="window.print()">Imprimir / Salvar PDF</button></div></body></html>`)
  reportWindow.document.close()
  return true
}
