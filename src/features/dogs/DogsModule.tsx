import { useState } from 'react'
import type { ReactNode } from 'react'
import type { useDogs } from './useDogs'
import { DogDetails } from './DogDetails'
import { DogForm } from './DogForm'
import { DogList } from './DogList'
import type { Dog, DogFormData, DogScreen } from './dogTypes'

type DogsModuleProps = {
  dogsApi: ReturnType<typeof useDogs>
  initialScreen: DogScreen
  notice?: ReactNode
}

export function DogsModule({ dogsApi, initialScreen, notice }: DogsModuleProps) {
  const { dogs, createDog, createTutor, updateDog, removeDog } = dogsApi
  const [screen, setScreen] = useState<DogScreen>(initialScreen)
  const [selected, setSelected] = useState<Dog | null>(null)

  function open(next: DogScreen, dog: Dog) {
    setSelected(dog)
    setScreen(next)
  }

  async function handleCreate(data: DogFormData) {
    await createDog(data)
    setScreen('list')
  }

  async function handleEdit(data: DogFormData) {
    if (!selected) return
    await updateDog(selected.id, data)
    setScreen('list')
  }

  async function handleRemove(dog: Dog) {
    await removeDog(dog.id)
    setScreen('list')
  }

  return (
    <>
      {notice}
      {screen === 'list' && (
        <DogList
          dogs={dogs}
          onCreate={() => setScreen('create')}
          onEdit={(dog) => open('edit', dog)}
          onDetails={(dog) => open('details', dog)}
        />
      )}
      {screen === 'create' && (
        <DogForm onSave={handleCreate} onCreateTutor={createTutor} onCancel={() => setScreen('list')} />
      )}
      {screen === 'edit' && selected && (
        <DogForm
          dog={selected}
          editing
          onSave={handleEdit}
          onCreateTutor={createTutor}
          onCancel={() => setScreen('list')}
        />
      )}
      {screen === 'details' && selected && (
        <DogDetails dog={selected} onBack={() => setScreen('list')} onRemove={() => handleRemove(selected)} />
      )}
    </>
  )
}
