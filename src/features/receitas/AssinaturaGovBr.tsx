export const ASSINADOR_GOV_BR = 'https://assinador.iti.br/'

export function BotaoAssinarGovBr() {
  return (
    <a className="outline-button rx-sign-link" href={ASSINADOR_GOV_BR} target="_blank" rel="noopener noreferrer">
      Assinar no gov.br ↗
    </a>
  )
}

export function PassosAssinaturaGovBr() {
  return (
    <aside className="rx-signature">
      <strong>Como assinar esta receita pelo gov.br</strong>
      <ol>
        <li>
          Clique em <b>Baixar PDF / Imprimir</b> e, na janela de impressão, escolha <b>Salvar como PDF</b>.
        </li>
        <li>
          Clique em <b>Assinar no gov.br</b> e entre com a sua conta gov.br (nível prata ou ouro).
        </li>
        <li>Envie o PDF salvo, posicione a assinatura, assine e baixe a receita assinada.</li>
      </ol>
      <small>
        Depois de assinado, o PDF não pode ser alterado. Receitas de medicamentos controlados exigem certificado digital
        ICP-Brasil.
      </small>
    </aside>
  )
}
