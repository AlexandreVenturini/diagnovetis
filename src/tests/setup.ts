import { beforeEach, vi } from 'vitest'

const store: Record<string, string> = {}

const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => {
    store[key] = value
  },
  removeItem: (key: string) => {
    delete store[key]
  },
  clear: () => {
    Object.keys(store).forEach((k) => delete store[k])
  },
  get length() {
    return Object.keys(store).length
  },
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
  Object.keys(supabaseTables).forEach((k) => {
    supabaseTables[k] = []
  })
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
    result = result.map((row) => {
      const fkKey = explicitFk ?? `${joinTable.replace(/s$/, '')}_id`
      const fkVal = row[fkKey]
      const related = getTable(joinTable).find((r) => r.id === fkVal) ?? null
      return { ...row, [joinTable]: related }
    })
  }
  return result
}

function buildSelectChain(table: string, cols = '*') {
  const eqFilters: [string, unknown][] = []
  const inFilters: [string, unknown[]][] = []
  const predicates: ((row: Row) => boolean)[] = []
  let orderBy: [string, boolean] | null = null
  let limitCount: number | null = null
  let isSingle = false

  const exec = (): { data: Row | Row[] | null; error: null } => {
    let rows = [...getTable(table)]
    for (const [col, val] of eqFilters) rows = rows.filter((r) => r[col] === val)
    for (const [col, vals] of inFilters) rows = rows.filter((r) => vals.includes(r[col]))
    for (const predicate of predicates) rows = rows.filter(predicate)
    if (orderBy) {
      const [col, ascending] = orderBy
      rows.sort((a, b) => {
        const x = a[col] as number | string
        const y = b[col] as number | string
        return (Number(x > y) - Number(x < y)) * (ascending ? 1 : -1)
      })
    }
    if (limitCount !== null) rows = rows.slice(0, limitCount)
    rows = resolveJoins(table, cols, rows)
    if (isSingle) return { data: rows[0] ?? null, error: null }
    return { data: rows, error: null }
  }

  const chain: Record<string, unknown> = {
    eq(col: string, val: unknown) {
      eqFilters.push([col, val])
      return chain
    },
    in(col: string, vals: unknown[]) {
      inFilters.push([col, vals])
      return chain
    },
    gte(col: string, val: string | number) {
      predicates.push((r) => r[col] != null && (r[col] as string | number) >= val)
      return chain
    },
    lte(col: string, val: string | number) {
      predicates.push((r) => r[col] != null && (r[col] as string | number) <= val)
      return chain
    },
    neq(col: string, val: unknown) {
      predicates.push(
        (r) =>
          JSON.stringify(r[col]) !==
          JSON.stringify(typeof val === 'string' && val.startsWith('[') ? JSON.parse(val) : val),
      )
      return chain
    },
    is(col: string, val: null) {
      predicates.push((r) => (r[col] ?? null) === val)
      return chain
    },
    not(col: string, op: string, val: unknown) {
      if (op === 'is') predicates.push((r) => (r[col] ?? null) !== val)
      return chain
    },
    order(col: string, options?: { ascending?: boolean }) {
      orderBy = [col, options?.ascending !== false]
      return chain
    },
    limit(count: number) {
      limitCount = count
      return chain
    },
    single() {
      isSingle = true
      return chain
    },
    maybeSingle() {
      isSingle = true
      return chain
    },
    then(resolve: (v: ReturnType<typeof exec>) => void) {
      resolve(exec())
    },
  }
  return chain
}

type ArgumentosSalvar = {
  p_id: number | null
  p_consulta: Row
  p_exames: Row[]
  p_participantes: string[]
  p_finalizar: boolean
}

function removerOnde(tabela: string, condicao: (linha: Row) => boolean) {
  const linhas = getTable(tabela)
  for (let i = linhas.length - 1; i >= 0; i--) if (condicao(linhas[i])) linhas.splice(i, 1)
}

function salvarAtendimentoMock({ p_id, p_consulta, p_exames, p_finalizar }: ArgumentosSalvar) {
  const consultas = getTable('consultas')
  let id = p_id
  if (id === null) {
    id = Math.max(0, ...consultas.map((linha) => linha.id as number)) + 1
  } else {
    const atual = consultas.find((linha) => linha.id === id)
    if (!atual) return { data: null, error: { message: 'Atendimento não encontrado' } }
    if (atual.situacao !== 'aberto') return { data: null, error: { message: 'Este atendimento já foi finalizado' } }
  }
  const novosExames = p_exames.map((linha) => ({ ...linha, id: linha.id ?? _autoId++, consulta_id: id }))
  if (
    novosExames.some((linha) =>
      getTable('exames').some((existente) => existente.id === linha.id && existente.consulta_id !== id),
    )
  )
    return { data: null, error: { message: 'Exame duplicado' } }
  removerOnde('consultas', (linha) => linha.id === id)
  removerOnde('exames', (linha) => linha.consulta_id === id)
  consultas.push({ ...p_consulta, id, situacao: p_finalizar ? 'finalizado' : 'aberto' })
  getTable('exames').push(...novosExames)
  return { data: id, error: null }
}

function descartarAtendimentoMock(id: number) {
  const atual = getTable('consultas').find((linha) => linha.id === id)
  if (!atual || atual.situacao !== 'aberto')
    return { data: null, error: { message: 'Só atendimentos em andamento podem ser descartados' } }
  removerOnde('exames', (linha) => linha.consulta_id === id)
  removerOnde('consultas', (linha) => linha.id === id)
  return { data: null, error: null }
}

export const supabaseMock = {
  async rpc(name: string, args: Record<string, unknown>) {
    if (name === 'salvar_atendimento') return salvarAtendimentoMock(args as unknown as ArgumentosSalvar)
    if (name === 'descartar_atendimento') return descartarAtendimentoMock(args.p_consulta as number)
    return { data: null, error: { message: 'RPC desconhecida' } }
  },
  from(table: string) {
    return {
      select(cols = '*') {
        return buildSelectChain(table, cols)
      },

      insert(data: Row | Row[]) {
        const rows = Array.isArray(data) ? data : [data]
        const inserted: Row[] = rows.map((r) => {
          const row = { ...r }
          if (row.id === undefined || row.id === null) row.id = _autoId++
          getTable(table).push(row)
          return row
        })

        const afterInsert = {
          select() {
            let isSingle = false
            const afterSelect = {
              single() {
                isSingle = true
                return afterSelect
              },
              then(resolve: (v: { data: Row | null; error: null }) => void) {
                resolve({ data: isSingle ? (inserted[0] ?? null) : (inserted as unknown as Row), error: null })
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
          eq(col: string, val: unknown) {
            filters.push([col, val])
            return chain
          },
          select() {
            return chain
          },
          single() {
            single = true
            return chain
          },
          then(resolve: (value: { data: Row | Row[] | null; error: null }) => void) {
            const rows = getTable(table).filter((row) => filters.every(([col, value]) => row[col] === value))
            rows.forEach((row) => Object.assign(row, data))
            resolve({ data: single ? (rows[0] ?? null) : rows, error: null })
          },
        }
        return chain
      },

      delete() {
        return {
          eq(col: string, val: unknown) {
            supabaseTables[table] = getTable(table).filter((r) => r[col] !== val)
            return Promise.resolve({ error: null })
          },
        }
      },
    }
  },
}

export function inserirMedico(medico: {
  id: number
  nome: string
  telefone: string
  email: string
  especialidade: string
  crmv: string
}) {
  getTable('medicos').push({
    id: medico.id,
    nome: medico.nome,
    telefone: medico.telefone,
    email: medico.email,
    especialidade: medico.especialidade,
    crmv: medico.crmv,
  })
}

vi.mock('../services/storage/supabaseClient', () => ({
  supabase: supabaseMock,
  supabaseConfigurado: true,
}))

beforeEach(async () => {
  localStorageMock.clear()
  clearAllTables()
})
