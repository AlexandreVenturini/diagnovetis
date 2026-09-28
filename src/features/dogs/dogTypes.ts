export type Dog = {
  id: number
  name: string
  breed: string
  age: string
  weight: string
  sex: string
  tutor: string
  contact: string
  history: string
  createdAt?: string
}

export type DogFormData = Omit<Dog, 'id'>
export type DogScreen = 'list' | 'create' | 'edit' | 'details'
