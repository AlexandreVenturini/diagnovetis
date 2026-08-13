export interface Repository<T extends { id: number }> {
    getAll(): Promise<T[]>
    getById(id: number): Promise<T | undefined>
    add(item: T): Promise<void>
    update(item: T): Promise<void>
    remove(id: number): Promise<void>
}
