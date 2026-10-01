import type { DadosAtendimento } from '../atendimentos/atendimentoTipos'
import { formatarIdadePet } from '../pets/idadePet'
import cssImpressaoReceita from './impressao/receita-impressao.css?raw'

export type ItemReceita = {
  medicamento: string
  dose: string
  via: string
  frequencia: string
  duracao: string
  quantidade: string
}
export type Receita = { crmv: string; orientacoes: string; itens: ItemReceita[] }
export const itemReceitaVazio = (): ItemReceita => ({
  medicamento: '',
  dose: '',
  via: '',
  frequencia: '',
  duracao: '',
  quantidade: '',
})
export const receitaVazia = (): Receita => ({ crmv: '', orientacoes: '', itens: [itemReceitaVazio()] })

export function temReceita(receita: Receita): boolean {
  return Boolean(
    receita.crmv.trim() ||
    receita.orientacoes.trim() ||
    receita.itens.some((item) => Object.values(item).some((valor) => valor.trim())),
  )
}

export function validarReceita(dados: DadosAtendimento, receita: Receita): string {
  if (![dados.nomePet, dados.nomeTutor, dados.veterinario].every((valor) => valor.trim()))
    return 'Preencha o paciente, o tutor e o veterinário na etapa de identificação.'
  if (!receita.crmv.trim()) return 'Informe o CRMV e a UF do veterinário.'
  if (!receita.itens.length || receita.itens.some((item) => Object.values(item).some((valor) => !valor.trim())))
    return 'Preencha medicamento, dose, via, frequência, duração e quantidade de todos os itens.'
  return ''
}

function escapar(valor: string) {
  return valor
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export function htmlReceita(dados: DadosAtendimento, receita: Receita, emitidaEm = new Date()): string {
  const erro = validarReceita(dados, receita)
  if (erro) throw new Error(erro)
  const campo = (rotulo: string, valor: string) =>
    `<div><span>${rotulo}</span><strong>${escapar(valor.trim() || 'Não informado')}</strong></div>`
  const item = (medicamento: ItemReceita, indice: number) => `
      <section class="item">
        <h3>${indice + 1}. ${escapar(medicamento.medicamento)}</h3>
        <p><b>Dose:</b> ${escapar(medicamento.dose)}</p>
        <p><b>Via:</b> ${escapar(medicamento.via)} · <b>Frequência:</b> ${escapar(medicamento.frequencia)}</p>
        <p><b>Duração:</b> ${escapar(medicamento.duracao)}</p>
        <p><b>Quantidade a dispensar:</b> ${escapar(medicamento.quantidade)}</p>
      </section>`
  const orientacoes = receita.orientacoes.trim()
    ? `<h2>Orientações ao tutor</h2>
      <p class="instructions">${escapar(receita.orientacoes)}</p>`
    : ''

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Receita - ${escapar(dados.nomePet)}</title>
    <style>${cssImpressaoReceita}</style>
  </head>
  <body>
    <main class="page">
      <header>
        <h1>DiagnoVetis</h1>
        <p>IFES Santa Teresa · Sistema de Gestão Veterinária</p>
      </header>
      <h2>Receita veterinária</h2>
      <p>Data: ${escapar(emitidaEm.toLocaleDateString('pt-BR'))}</p>
      <section class="patient">
        ${campo('Paciente', dados.nomePet)}
        ${campo('Tutor', dados.nomeTutor)}
        ${campo('Espécie', 'Canina')}
        ${campo('Raça', dados.raca)}
        ${campo('Peso (kg)', dados.peso || '')}
        ${campo('Identificação', dados.idPaciente || '')}
        ${campo('Idade', formatarIdadePet(dados.idade))}
        ${campo('Veterinário', dados.veterinario)}
      </section>
      ${receita.itens.map(item).join('')}
      ${orientacoes}
      <div class="signature">
        <p><b>${escapar(dados.veterinario)}</b></p>
        <p>CRMV: ${escapar(receita.crmv)}</p>
        <p>Assinatura do médico-veterinário</p>
      </div>
      <footer>DiagnoVetis · Receita preenchida pelo profissional responsável.</footer>
    </main>
    <div class="actions">
      <button onclick="window.print()">Imprimir / Salvar PDF</button>
      <button onclick="window.close()">Fechar</button>
    </div>
  </body>
</html>`
}

export function gerarReceita(dados: DadosAtendimento, receita: Receita, emitidaEm = new Date()): boolean {
  const html = htmlReceita(dados, receita, emitidaEm)
  const popup = window.open('', '_blank', 'width=900,height=800')
  if (!popup) return false
  popup.document.open()
  popup.document.write(html)
  popup.document.close()
  return true
}
