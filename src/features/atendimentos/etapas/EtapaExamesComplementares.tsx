import { useState } from 'react'
import { novoExame, type RascunhoExame } from '../exameTipos'
import { CamposExame } from '../CamposExame'

const laboratorio = ['Hemograma', 'Bioquímica sérica', 'Urinálise', 'Exame de fezes', 'Citologia', 'Sorologia', 'PCR']
const imagem = ['Radiografia', 'Ultrassonografia']
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
  const [personalizado, setPersonalizado] = useState('')
  const [categoria, setCategoria] = useState<RascunhoExame['categoria']>('outro')
  return (
    <section
      inert={exames.some((exame) => exame.laudoCarregando)}
      className="consultation-panel content-card complementary-exams-step"
    >
      <h2>4. Exames complementares</h2>
      <p>
        Selecione os exames solicitados neste atendimento. Registre o laudo em texto ou anexe um PDF ou imagem em cada
        exame selecionado. Os laudos serão salvos ao finalizar o atendimento e poderão ser atualizados no prontuário.
      </p>
      {(
        [
          { titulo: 'Laboratoriais', nomes: laboratorio, categoria: 'laboratorial' },
          { titulo: 'Imagem', nomes: imagem, categoria: 'imagem' },
        ] as const
      ).map((grupo) => (
        <fieldset className="exam-catalog" key={grupo.titulo}>
          <legend>{grupo.titulo}</legend>
          {grupo.nomes.map((nome) => (
            <button
              type="button"
              className="exam-choice"
              key={nome}
              disabled={exames.some((exame) => exame.nome === nome)}
              onClick={() => aoAlterar([...exames, novoExame(nome, grupo.categoria)])}
            >
              ＋ {nome}
            </button>
          ))}
        </fieldset>
      ))}
      <div className="consultation-form-grid exam-custom">
        <label>
          Outro exame
          <input value={personalizado} onChange={(e) => setPersonalizado(e.target.value)} placeholder="Nome do exame" />
        </label>
        <label>
          Categoria
          <select value={categoria} onChange={(e) => setCategoria(e.target.value as RascunhoExame['categoria'])}>
            <option value="laboratorial">Laboratorial</option>
            <option value="imagem">Imagem</option>
            <option value="outro">Outro</option>
          </select>
        </label>
        <button
          type="button"
          className="secondary-button"
          disabled={!personalizado.trim()}
          onClick={() => {
            aoAlterar([...exames, novoExame(personalizado.trim(), categoria)])
            setPersonalizado('')
          }}
        >
          Adicionar exame
        </button>
      </div>
      <h3>Exames selecionados ({exames.length})</h3>
      {!exames.length && <p>Nenhum exame solicitado. Você pode continuar sem adicionar exames.</p>}
      {exames.map((exame, indice) => (
        <fieldset className="exam-request" key={exame.key}>
          <legend>
            {indice + 1}. {exame.nome || 'Novo exame'}
          </legend>
          <CamposExame
            valor={exame}
            aoAlterar={(valor) => aoAlterar(exames.map((atual) => (atual.key === exame.key ? valor : atual)))}
          />
          <button
            type="button"
            className="secondary-button"
            onClick={() => aoAlterar(exames.filter((atual) => atual.key !== exame.key))}
          >
            Remover solicitação
          </button>
        </fieldset>
      ))}
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
