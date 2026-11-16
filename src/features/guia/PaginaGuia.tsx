import { CabecalhoTela } from '../../components/common/CabecalhoTela'

const MATERIAIS = [
  {
    icone: '📄',
    titulo: 'Guia em PDF',
    descricao: 'Passo a passo de cada parte do site: cadastros, agenda, atendimento, prontuário e receitas.',
  },
  {
    icone: '▶',
    titulo: 'Vídeo do site na prática',
    descricao: 'Demonstração completa de um atendimento, do agendamento até a receita.',
  },
]

export function PaginaGuia({ aoFechar }: { aoFechar: () => void }) {
  return (
    <section className="guide-page">
      <CabecalhoTela
        voltar={{ rotulo: 'Voltar ao painel', aoClicar: aoFechar }}
        titulo="Guia do site"
        descricao="Materiais para aprender a usar o DiagnoVetis."
      />
      <div className="guide-materials">
        {MATERIAIS.map((material) => (
          <article key={material.titulo} className="content-card guide-card">
            <span aria-hidden="true">{material.icone}</span>
            <h3>{material.titulo}</h3>
            <p>{material.descricao}</p>
            <small className="pill">Em breve</small>
          </article>
        ))}
      </div>
    </section>
  )
}
