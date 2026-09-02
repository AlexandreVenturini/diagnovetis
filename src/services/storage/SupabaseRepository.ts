import type { Repository } from '../../interfaces/Repository'
import { supabase } from './supabaseClient'

export class SupabaseRepository<T extends { id: number }> implements Repository<T> {
    private readonly table: string
    private readonly deserialize: (raw: unknown) => T
    private readonly serialize: (item: T) => unknown

    constructor(
        table: string,
        serialize: (item: T) => unknown,
        deserialize: (raw: unknown) => T
    ) {
        this.table = table
        this.serialize = serialize
        this.deserialize = deserialize
    }

    async getAll(): Promise<T[]> {
        const { data, error } = await supabase.from(this.table).select('*')
        if (error) throw new Error(error.message)
        return (data ?? []).map(row => this.deserialize(row))
    }

    async getById(id: number): Promise<T | undefined> {
        const { data, error } = await supabase.from(this.table).select('*').eq('id', id).single()
        if (error || !data) return undefined
        return this.deserialize(data)
    }

    async add(item: T): Promise<void> {
        const { error } = await supabase.from(this.table).insert(this.serialize(item) as Record<string, unknown>)
        if (error) throw new Error(error.message)
    }

    async update(item: T): Promise<void> {
        const { error } = await supabase.from(this.table).update(this.serialize(item) as Record<string, unknown>).eq('id', item.id)
        if (error) throw new Error(error.message)
    }

    async remove(id: number): Promise<void> {
        const { error } = await supabase.from(this.table).delete().eq('id', id)
        if (error) throw new Error(error.message)
    }

    findByIdSync(_id: number): T | undefined {
        return undefined
    }
}
