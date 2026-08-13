import type { Repository } from "../../interfaces/Repository";

export class LocalStorageRepository<T extends { id: number }> implements Repository<T> {
    private readonly storageKey: string;
    private readonly serialize: (item: T) => unknown;
    private readonly deserialize: (raw: unknown) => T;
    private items: T[];

    constructor(
        storageKey: string,
        serialize: (item: T) => unknown,
        deserialize: (raw: unknown) => T
    ) {
        this.storageKey = storageKey;
        this.serialize = serialize;
        this.deserialize = deserialize;
        this.items = this.load();
    }

    private load(): T[] {
        if (typeof localStorage === "undefined") return [];
        const raw = localStorage.getItem(this.storageKey);
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw) as unknown[];
            return parsed.map(item => this.deserialize(item));
        } catch {
            return [];
        }
    }

    private persist(): void {
        if (typeof localStorage === "undefined") return;
        localStorage.setItem(
            this.storageKey,
            JSON.stringify(this.items.map(item => this.serialize(item)))
        );
    }

    async getAll(): Promise<T[]> {
        return [...this.items];
    }

    async getById(id: number): Promise<T | undefined> {
        return this.items.find(item => item.id === id);
    }

    async add(item: T): Promise<void> {
        this.items.push(item);
        this.persist();
    }

    async update(item: T): Promise<void> {
        this.items = this.items.map(existing => existing.id === item.id ? item : existing);
        this.persist();
    }

    async remove(id: number): Promise<void> {
        this.items = this.items.filter(item => item.id !== id);
        this.persist();
    }

    /** Busca síncrona — use apenas em deserializers onde async não é possível */
    findByIdSync(id: number): T | undefined {
        return this.items.find(item => item.id === id);
    }

    clear(): void {
        this.items = [];
        if (typeof localStorage !== "undefined") {
            localStorage.removeItem(this.storageKey);
        }
    }
}
