import { beforeEach, vi } from 'vitest'

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

function resolveJoins(_table: string, cols: string, rows: Row[]): Row[] {
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
        maybeSingle() { isSingle = true; return chain },
        then(resolve: (v: ReturnType<typeof exec>) => void) { resolve(exec()) },
    }
    return chain
}

export const supabaseMock = {
    async rpc(name: string, args: { p_consulta: Row; p_exames: Row[] }) {
        if (name !== 'salvar_consulta_com_exames') return { error: { message: 'RPC desconhecida' } }
        if (getTable('consultas').some(row => row.id === args.p_consulta.id)) return { error: { message: 'Consulta duplicada' } }
        const rows = args.p_exames.map(row => ({ ...row, id: row.id ?? _autoId++, consulta_id: args.p_consulta.id }))
        if (rows.some(row => getTable('exames').some(existing => existing.id === row.id))) return { error: { message: 'Exame duplicado' } }
        getTable('consultas').push({ ...args.p_consulta })
        getTable('exames').push(...rows)
        return { error: null }
    },
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
                const filters: [string, unknown][] = []
                let single = false
                const chain = {
                    eq(col: string, val: unknown) { filters.push([col, val]); return chain },
                    select() { return chain },
                    single() { single = true; return chain },
                    then(resolve: (value: { data: Row | Row[] | null; error: null }) => void) {
                        const rows = getTable(table).filter(row => filters.every(([col, value]) => row[col] === value))
                        rows.forEach(row => Object.assign(row, data))
                        resolve({ data: single ? rows[0] ?? null : rows, error: null })
                    },
                }
                return chain
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

beforeEach(async () => {
    localStorageMock.clear()
    clearAllTables()
})
