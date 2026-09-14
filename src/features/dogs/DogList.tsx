import { Icon } from '../../components/common/Icon'
import type { Dog } from './dogTypes'
import { formatDogAge } from './dogAge'

type DogListProps = {
  dogs: Dog[]
  onCreate: () => void
  onEdit: (dog: Dog) => void
  onDetails: (dog: Dog) => void
}

export function DogList({ dogs, onCreate, onEdit, onDetails }: DogListProps) {
  return (
    <section className="dog-list">
      <div className="section-heading">
        <h2>Cães Cadastrados</h2>
        <button className="primary-button new-button" onClick={onCreate}><span>＋</span> Novo Cadastro</button>
      </div>

      <div className="dog-grid">
        {dogs.map((dog) => (
          <article className="dog-card" key={dog.id}>
            <div className="dog-card-heading">
              <h3>{dog.name}</h3>
              <div className="card-actions">
                <button aria-label={`Ver detalhes de ${dog.name}`} onClick={() => onDetails(dog)}>
                  <Icon><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></Icon>
                </button>
                <button aria-label={`Editar ${dog.name}`} onClick={() => onEdit(dog)}>
                  <Icon><path d="m4 16-1 5 5-1L19 9l-4-4zM13.5 6.5l4 4" /></Icon>
                </button>
              </div>
            </div>
            <p className="breed">{dog.breed}</p>
            <p>Idade: {formatDogAge(dog.age)}</p>
            <p>Peso: {dog.weight} kg</p>
            <p>Tutor: {dog.tutor}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
