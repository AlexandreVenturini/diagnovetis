import { beforeEach, vi } from 'vitest'

// ── Mock do localStorage ────────────────────────────────────────────────────
const store: Record<string, string> = {}

const localStorageMock = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { Object.keys(store).forEach(k => delete store[k]) },
    get length() { return Object.keys(store).length },
    key: (index: number) => Object.keys(store)[index] ?? null,
}

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true })

// ── Mock em memória do Supabase ─────────────────────────────────────────────
const supabaseTables: Record<string, Record<string, unknown>[]> = {}
let _autoId = 1000

function getTable(name: string): Record<string, unknown>[] {
    if (!supabaseTables[name]) supabaseTables[name] = []
    return supabaseTables[name]
}

function clearAllTables() {
    Object.keys(supabaseTables).forEach(k => { supabaseTables[k] = [] })
    _autoId = 1000
}

type Row = Record<string, unknown>

/** Resolve joins — suporta "tabela(*)" e "tabela!fk_col(*)" */
function resolveJoins(_table: string, cols: string, rows: Row[]): Row[] {
    // match all join specs: "word!word(*)" ou "word(*)"
    const pattern = /(\w+)(?:!(\w+))?\(\*\)/g
    let match: RegExpExecArray | null
    let result = rows
    while ((match = pattern.exec(cols)) !== null) {
        const joinTable = match[1]
        const explicitFk = match[2] // pode ser undefined
        result = result.map(row => {
            const fkKey = explicitFk ?? `${joinTable.replace(/s$/, '')}_id`
            const fkVal = row[fkKey]
            const related = getTable(joinTable).find(r => r.id === fkVal) ?? null
            return { ...row, [joinTable]: related }
        })
    }
    return result
}

function buildSelectChain(table: string, cols = '*') {
    let eqFilters: [string, unknown][] = []
    let isSingle = false

    const exec = (): { data: Row | Row[] | null; error: null } => {
        let rows = [...getTable(table)]
        for (const [col, val] of eqFilters) rows = rows.filter(r => r[col] === val)
        rows = resolveJoins(table, cols, rows)
        if (isSingle) return { data: rows[0] ?? null, error: null }
        return { data: rows, error: null }
    }

    const chain: Record<string, unknown> = {
        eq(col: string, val: unknown) { eqFilters.push([col, val]); return chain },
        single() { isSingle = true; return chain },
        then(resolve: (v: ReturnType<typeof exec>) => void) { resolve(exec()) },
    }
    return chain
}

export const supabaseMock = {
    from(table: string) {
        return {
            select(cols = '*') {
                return buildSelectChain(table, cols)
            },

            insert(data: Row | Row[]) {
                const rows = Array.isArray(data) ? data : [data]
                const inserted: Row[] = rows.map(r => {
                    const row = { ...r }
                    if (row.id === undefined || row.id === null) row.id = _autoId++
                    getTable(table).push(row)
                    return row
                })

                // Suporte a .insert().select().single()
                const afterInsert = {
                    select(_cols = '*') {
                        let isSingle = false
                        const afterSelect = {
                            single() { isSingle = true; return afterSelect },
                            then(resolve: (v: { data: Row | null; error: null }) => void) {
                                resolve({ data: isSingle ? (inserted[0] ?? null) : inserted as unknown as Row, error: null })
                            },
                        }
                        return afterSelect
                    },
                    then(resolve: (v: { error: null }) => void) {
                        resolve({ error: null })
                    },
                }
                return afterInsert
            },

            update(data: Row) {
                return {
                    eq(col: string, val: unknown) {
                        const t = getTable(table)
                        const idx = t.findIndex(r => r[col] === val)
                        if (idx !== -1) t[idx] = { ...t[idx], ...data }
                        return Promise.resolve({ error: null })
                    },
                }
            },

            delete() {
                return {
                    eq(col: string, val: unknown) {
                        supabaseTables[table] = getTable(table).filter(r => r[col] !== val)
                        return Promise.resolve({ error: null })
                    },
                }
            },
        }
    },
}

vi.mock('../services/storage/supabaseClient', () => ({
    supabase: supabaseMock,
}))

// ── Limpeza entre testes ────────────────────────────────────────────────────
beforeEach(async () => {
    // Limpa o localStorage mock
    localStorageMock.clear()

    // Limpa o banco em memória do Supabase
    clearAllTables()

})
