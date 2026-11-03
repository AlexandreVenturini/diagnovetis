import { useState } from 'react'
import { ROTULOS_STATUS_EXAME } from '../../../models/Exame'
import { CamposExame } from '../CamposExame'
import { GRUPOS_EXAME } from '../catalogoExames'
import { modeloDoRascunho, type RascunhoExame } from '../exameTipos'
import { SeletorExames } from '../SeletorExames'

const ROTULOS_CATEGORIA = { laboratorial: 'Laboratorial', imagem: 'Imagem', outro: 'Outro exame' } as const

export function EtapaExamesComplementares({
  exames,
  aoAlterar,
  aoVoltar,
  aoAvancar,
}: {
  exames: RascunhoExame[]
  aoAlterar: (exames: RascunhoExame[]) => void
  aoVoltar: () => void
  aoAvancar: () => void
}) {
  const [abertos, setAbertos] = useState<string[]>([])
  const alternar = (key: string) =>
    setAbertos((atuais) => (atuais.includes(key) ? atuais.filter((atual) => atual !== key) : [...atuais, key]))
  return (
    <section
      inert={exames.some((exame) => exame.laudoCarregando)}
      className="consultation-panel content-card complementary-exams-step"
    >
      <h2>4. Exames complementares</h2>
      <p>
        Busque ou escolha os exames solicitados neste atendimento. Cada exame tem os próprios campos de resultado; o
        laudo pode ser digitado ou anexado em PDF. Os resultados também podem ser preenchidos depois, no prontuário.
      </p>
      <SeletorExames
        selecionados={exames}
        aoAdicionar={(exame) => {
          aoAlterar([...exames, exame])
          setAbertos((atuais) => [...atuais, exame.key])
        }}
      />
      <h3>Exames selecionados ({exames.length})</h3>
      {!exames.length && <p>Nenhum exame solicitado. Você pode continuar sem adicionar exames.</p>}
      {exames.map((exame, indice) => {
        const aberto = abertos.includes(exame.key)
        const modelo = modeloDoRascunho(exame)
        return (
          <article className={aberto ? 'exam-request open' : 'exam-request'} key={exame.key}>
            <header>
              <button
                type="button"
                className="exam-request-toggle"
                aria-expanded={aberto}
                onClick={() => alternar(exame.key)}
              >
                <span aria-hidden="true">{aberto ? '▾' : '▸'}</span>
                <strong>
                  {indice + 1}. {exame.nome || 'Novo exame'}
                </strong>
                <small>{modelo ? GRUPOS_EXAME[modelo.grupo] : ROTULOS_CATEGORIA[exame.categoria]}</small>
              </button>
              <span className={`exam-status exam-status-${exame.status}`}>{ROTULOS_STATUS_EXAME[exame.status]}</span>
              <button
                type="button"
                className="secondary-button"
                onClick={() => aoAlterar(exames.filter((atual) => atual.key !== exame.key))}
              >
                Remover
              </button>
            </header>
            {aberto && (
              <CamposExame
                valor={exame}
                aoAlterar={(valor) => aoAlterar(exames.map((atual) => (atual.key === exame.key ? valor : atual)))}
              />
            )}
          </article>
        )
      })}
      <div className="step-navigation">
        <button type="button" className="secondary-button" onClick={aoVoltar}>
          ← Exame físico
        </button>
        <button type="button" className="primary-button" onClick={aoAvancar}>
          Diagnóstico e conduta →
        </button>
      </div>
    </section>
  )
}
