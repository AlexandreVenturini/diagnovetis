import recordPrintCss from './print/record-print.css?raw'

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
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
  const sourceControls = Array.from(
    form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input, textarea, select'),
  )
  const clonedControls = Array.from(
    printableForm.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      'input, textarea, select',
    ),
  )
  clonedControls.forEach((control, index) => control.replaceWith(printableValue(sourceControls[index] ?? control)))

  printableForm.querySelectorAll('.exam-no-print').forEach((element) => element.remove())

  reportWindow.document.write(`<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Prontuário - ${escapeHtml(dogName)}</title>
    <style>${recordPrintCss}</style>
  </head>
  <body>
    ${printableForm.outerHTML}
    <div class="actions">
      <button class="close" onclick="window.close()">Fechar</button>
      <button class="print" onclick="window.print()">Imprimir / Salvar PDF</button>
    </div>
  </body>
</html>`)
  reportWindow.document.close()
  return true
}
