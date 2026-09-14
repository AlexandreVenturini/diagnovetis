import type { Dog } from './dogTypes'
import { formatDogAge } from './dogAge'

type DogDetailsProps = {
  dog: Dog
  onBack: () => void
  onRemove?: () => void
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return <div className="detail-item"><span>{label}</span><strong>{value}</strong></div>
}

export function DogDetails({ dog, onBack, onRemove }: DogDetailsProps) {
  return (
    <section className="content-card details-card">
      <div className="section-heading">
        <h2>Detalhes do Cão</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {onRemove && <button className="secondary-button" onClick={onRemove}>Remover</button>}
          <button className="secondary-button" onClick={onBack}>Voltar</button>
        </div>
      </div>
      <div className="details-grid">
        <DetailItem label="Nome" value={dog.name} />
        <DetailItem label="Espécie" value="Cão" />
        <DetailItem label="Raça" value={dog.breed} />
        <DetailItem label="Idade" value={formatDogAge(dog.age)} />
        <DetailItem label="Peso" value={`${dog.weight} kg`} />
        <DetailItem label="Sexo" value={dog.sex} />
        <DetailItem label="Tutor" value={dog.tutor} />
        <DetailItem label="Contato" value={dog.contact} />
        <div className="detail-item detail-history">
          <span>Histórico de Saúde</span>
          <strong>{dog.history || 'Não informado'}</strong>
        </div>
      </div>
    </section>
  )
}
