import type { RascunhoExame } from './exameTipos'
import { ROTULOS_STATUS_EXAME } from '../../models/Exame'
import type { DadosAtendimento } from './atendimentoTipos'
import cssImpressaoAtendimento from './impressao/atendimento-impressao.css?raw'

function escaparHtml(valor: string) {
  return valor
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function valorOuPadrao(valor: string, padrao = 'Não informado') {
  return escaparHtml(valor.trim() || padrao)
}

function campoLaudo(rotulo: string, valor: string) {
  return `<div class="field"><span>${rotulo}</span><strong>${valorOuPadrao(valor)}</strong></div>`
}

export function gerarRelatorioAtendimento(dados: DadosAtendimento, exames: RascunhoExame[] = []) {
  const janelaRelatorio = window.open('', '_blank', 'width=900,height=800')
  if (!janelaRelatorio) return false

  const emitidaEm = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date())

  const blocoExame = (exame: RascunhoExame) => `
        <div class="long-text">
          <b>${valorOuPadrao(exame.nome)}</b>
          <p>${valorOuPadrao(exame.categoria)} · Solicitação: ${valorOuPadrao(exame.dataSolicitacao)} · ${ROTULOS_STATUS_EXAME[exame.status]}</p>
          <p>Realização: ${valorOuPadrao(exame.dataRealizacao)}</p>
          <p>Resultado: ${valorOuPadrao(exame.resultado, 'Aguardando resultado')}</p>
          <p>Laudo: ${valorOuPadrao(exame.laudo ?? '')}</p>
          ${exame.laudoAnexo ? `<p>Anexo do laudo: ${valorOuPadrao(exame.laudoAnexo.nome)} (disponível no prontuário)</p>` : ''}
          <p>Interpretação: ${valorOuPadrao(exame.interpretacao)}</p>
        </div>`
  const comUnidade = (valor: string, unidade: string) => (valor ? `${valor} ${unidade}` : '')

  const conteudoDocumento = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Relatório Clínico - ${valorOuPadrao(dados.nomePet, 'Paciente')}</title>
  <style>${cssImpressaoAtendimento}</style>
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
        <span>Emitido em ${escaparHtml(emitidaEm)}</span>
      </div>
    </header>
    <div class="notice">Documento clínico destinado ao acompanhamento veterinário do paciente.</div>

    <section>
      <h2>1. Identificação do Paciente</h2>
      <div class="grid">
        ${campoLaudo('Nome do cão', dados.nomePet)}
        ${campoLaudo('Idade', dados.idade)}
        ${campoLaudo('Raça', dados.raca)}
        ${campoLaudo('Tutor responsável', dados.nomeTutor)}
        ${campoLaudo('Veterinário responsável', dados.veterinario)}
      </div>
    </section>

    <section>
      <h2>2. Histórico Clínico</h2>
      <div class="long-text"><span>Queixa principal</span><p>${valorOuPadrao(dados.queixaPrincipal)}</p></div>
      <div class="long-text long-text--spaced"><span>Histórico do animal</span><p>${valorOuPadrao(dados.historico)}</p></div>
    </section>

    <section>
      <h2>3. Exame Físico</h2>
      <div class="grid four">
        ${campoLaudo('Mucosas', dados.mucosas)}
        ${campoLaudo('TPC', dados.tpc)}
        ${campoLaudo('Frequência cardíaca', comUnidade(dados.frequenciaCardiaca, 'bpm'))}
        ${campoLaudo('Frequência respiratória', comUnidade(dados.frequenciaRespiratoria, 'mpm'))}
        ${campoLaudo('Temperatura', comUnidade(dados.temperatura, '°C'))}
        ${campoLaudo('Hidratação', dados.hidratacao)}
        ${campoLaudo('Nível de consciência', dados.nivelConsciencia)}
      </div>
    </section>

    <section>
      <h2>4. Avaliação e Conduta</h2>
      <div class="grid">
        ${campoLaudo('Diagnóstico clínico', dados.diagnostico ?? '')}
        ${campoLaudo('Suspeita / zoonose pesquisada', dados.suspeitaZoonose)}
      </div>
      <div class="long-text long-text--spaced"><span>Observações e conduta terapêutica</span><p>${valorOuPadrao(dados.conduta)}</p></div>
    </section>

    <section>
      <h2>Exames complementares</h2>
      ${exames.length ? exames.map(blocoExame).join('') : '<p>Nenhum exame solicitado.</p>'}
    </section>
    <div class="signatures">
      <div class="signature">
        <strong>${valorOuPadrao(dados.veterinario, 'Veterinário responsável')}</strong>
        <span>Assinatura e CRMV</span>
      </div>
      <div class="signature">
        <strong>${valorOuPadrao(dados.nomeTutor, 'Tutor responsável')}</strong>
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

  janelaRelatorio.document.open()
  janelaRelatorio.document.write(conteudoDocumento)
  janelaRelatorio.document.close()
  return true
}
