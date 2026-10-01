import cssImpressaoProntuario from './impressao/prontuario-impressao.css?raw'

function escaparHtml(valor: string) {
  return valor
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function valorImpressao(controle: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) {
  const saida = document.createElement('span')
  saida.className = 'printable-value'
  if (controle instanceof HTMLInputElement && controle.type === 'checkbox') {
    saida.className += ' printable-checkbox'
    saida.textContent = controle.checked ? '☒' : '☐'
  } else if (controle instanceof HTMLSelectElement) {
    saida.textContent = controle.selectedOptions[0]?.textContent ?? ''
  } else if (controle instanceof HTMLInputElement && controle.type === 'date' && controle.value) {
    saida.textContent = new Date(`${controle.value}T12:00:00`).toLocaleDateString('pt-BR')
  } else saida.textContent = controle.value
  return saida
}

export function exportarProntuario(formulario: HTMLFormElement, nomePet: string) {
  const janelaRelatorio = window.open('', '_blank', 'width=1100,height=900')
  if (!janelaRelatorio) return false

  const formularioImpressao = formulario.cloneNode(true) as HTMLFormElement
  formularioImpressao.querySelectorAll('.paper-section-actions').forEach((elemento) => elemento.remove())
  formularioImpressao.querySelectorAll('.paper-section.collapsed').forEach((secao) => secao.remove())
  formularioImpressao.querySelectorAll('.paper-section').forEach((secao) => {
    if (secao.querySelector('table')) secao.classList.add('table-section')
  })
  const controlesOrigem = Array.from(
    formulario.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input, textarea, select'),
  )
  const controlesCopiados = Array.from(
    formularioImpressao.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      'input, textarea, select',
    ),
  )
  controlesCopiados.forEach((controle, indice) =>
    controle.replaceWith(valorImpressao(controlesOrigem[indice] ?? controle)),
  )

  formularioImpressao.querySelectorAll('.exam-no-print').forEach((elemento) => elemento.remove())

  janelaRelatorio.document.write(`<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Prontuário - ${escaparHtml(nomePet)}</title>
    <style>${cssImpressaoProntuario}</style>
  </head>
  <body>
    ${formularioImpressao.outerHTML}
    <div class="actions">
      <button class="close" onclick="window.close()">Fechar</button>
      <button class="print" onclick="window.print()">Imprimir / Salvar PDF</button>
    </div>
  </body>
</html>`)
  janelaRelatorio.document.close()
  return true
}
