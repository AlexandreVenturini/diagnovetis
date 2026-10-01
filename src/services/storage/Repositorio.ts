export interface Repositorio<T extends { id: number }> {
  listarTodos(): Promise<T[]>
  getById(id: number): Promise<T | undefined>
  adicionar(item: T): Promise<void>
  atualizar(item: T): Promise<void>
  remover(id: number): Promise<void>
}
