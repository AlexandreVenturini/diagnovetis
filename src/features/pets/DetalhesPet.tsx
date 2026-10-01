import type { PetResumo } from './petTipos'
import { formatarIdadePet } from './idadePet'

type DetalhesPetProps = {
  pet: PetResumo
  erro?: string
  aoVoltar: () => void
  aoRemover?: () => void
}

function ItemDetalhe({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="detail-item">
      <span>{rotulo}</span>
      <strong>{valor}</strong>
    </div>
  )
}

export function DetalhesPet({ pet, erro, aoVoltar, aoRemover }: DetalhesPetProps) {
  return (
    <section className="content-card details-card">
      <div className="section-heading">
        <h2>Detalhes do Cão</h2>
        <div className="details-actions">
          {aoRemover && (
            <button className="secondary-button" onClick={aoRemover}>
              Remover
            </button>
          )}
          <button className="secondary-button" onClick={aoVoltar}>
            Voltar
          </button>
        </div>
      </div>
      {erro && (
        <p className="details-error" role="alert">
          {erro}
        </p>
      )}
      <div className="details-grid">
        <ItemDetalhe rotulo="Nome" valor={pet.nome} />
        <ItemDetalhe rotulo="Espécie" valor="Cão" />
        <ItemDetalhe rotulo="Raça" valor={pet.raca} />
        <ItemDetalhe rotulo="Idade" valor={formatarIdadePet(pet.idade)} />
        <ItemDetalhe rotulo="Peso" valor={`${pet.peso} kg`} />
        <ItemDetalhe rotulo="Sexo" valor={pet.sexo} />
        <ItemDetalhe rotulo="Tutor" valor={pet.tutor} />
        <ItemDetalhe rotulo="Contato" valor={pet.contato} />
        <div className="detail-item detail-history">
          <span>Histórico de Saúde</span>
          <strong>{pet.historico || 'Não informado'}</strong>
        </div>
      </div>
    </section>
  )
}
