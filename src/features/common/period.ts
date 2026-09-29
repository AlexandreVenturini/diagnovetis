export type PeriodView = 'day' | 'week' | 'month' | 'year' | 'all'
export type PeriodValue = { view: PeriodView; date: string }
export type DateRange = { start: string; end: string }

export const PERIOD_VIEWS: { view: PeriodView; label: string }[] = [
  { view: 'day', label: 'Dia' },
  { view: 'week', label: 'Semana' },
  { view: 'month', label: 'Mês' },
  { view: 'year', label: 'Ano' },
  { view: 'all', label: 'Tudo' },
]

export const dateInput = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const parse = (date: string) => new Date(`${date}T12:00:00`)

export function addDays(date: string, amount: number) {
  const next = parse(date)
  next.setDate(next.getDate() + amount)
  return dateInput(next)
}

export function periodBounds(date: string, view: Exclude<PeriodView, 'all'>): DateRange {
  const start = parse(date)
  if (view === 'week') start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  if (view === 'month') start.setDate(1)
  if (view === 'year') start.setMonth(0, 1)
  const end = new Date(start)
  if (view === 'week') end.setDate(end.getDate() + 6)
  if (view === 'month') end.setMonth(end.getMonth() + 1, 0)
  if (view === 'year') end.setMonth(11, 31)
  return { start: dateInput(start), end: dateInput(end) }
}

export function periodRange(value: PeriodValue): DateRange | null {
  return value.view === 'all' ? null : periodBounds(value.date, value.view)
}

export function shiftPeriod(date: string, view: PeriodView, amount: number) {
  const next = parse(date)
  if (view === 'year') next.setFullYear(next.getFullYear() + amount, 0, 1)
  else if (view === 'month') next.setMonth(next.getMonth() + amount, 1)
  else if (view === 'week') next.setDate(next.getDate() + amount * 7)
  else if (view === 'day') next.setDate(next.getDate() + amount)
  return dateInput(next)
}

export function periodLabel(date: string, view: PeriodView) {
  const format = (value: string, options: Intl.DateTimeFormatOptions) =>
    parse(value).toLocaleDateString('pt-BR', options)
  if (view === 'all') return 'Todo o período'
  if (view === 'day') return format(date, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
  if (view === 'month') return format(date, { month: 'long', year: 'numeric' })
  if (view === 'year') return format(date, { year: 'numeric' })
  const { start, end } = periodBounds(date, view)
  return `${format(start, { day: '2-digit', month: 'short' })} — ${format(end, { day: '2-digit', month: 'short', year: 'numeric' })}`
}

export function periodNoun(view: PeriodView) {
  return { day: 'do dia', week: 'da semana', month: 'do mês', year: 'do ano', all: 'de todo o período' }[view]
}

export function inRange(date: string, range: DateRange | null) {
  if (!range) return true
  return Boolean(date) && date >= range.start && date <= range.end
}

export function rangeStartIso(range: DateRange) {
  return new Date(`${range.start}T00:00:00`).toISOString()
}

export function rangeEndIso(range: DateRange) {
  return new Date(`${range.end}T23:59:59.999`).toISOString()
}

export function mergeRanges(ranges: DateRange[]): DateRange[] {
  const sorted = [...ranges].sort((a, b) => a.start.localeCompare(b.start))
  const merged: DateRange[] = []
  for (const range of sorted) {
    const last = merged.at(-1)
    if (last && range.start <= addDays(last.end, 1)) {
      if (range.end > last.end) last.end = range.end
    } else {
      merged.push({ ...range })
    }
  }
  return merged
}

export function missingRanges(loaded: DateRange[], range: DateRange): DateRange[] {
  const gaps: DateRange[] = []
  let cursor = range.start
  for (const block of mergeRanges(loaded)) {
    if (block.end < cursor) continue
    if (block.start > range.end) break
    if (block.start > cursor) gaps.push({ start: cursor, end: addDays(block.start, -1) })
    cursor = addDays(block.end, 1)
    if (cursor > range.end) return gaps
  }
  if (cursor <= range.end) gaps.push({ start: cursor, end: range.end })
  return gaps
}

export type RangeCache = { all: boolean; ranges: DateRange[] }

export function rangesToFetch(cache: RangeCache, range: DateRange | null): (DateRange | null)[] {
  if (cache.all) return []
  return range === null ? [null] : missingRanges(cache.ranges, range)
}

export function markLoaded(cache: RangeCache, range: DateRange | null): RangeCache {
  return range === null
    ? { all: true, ranges: cache.ranges }
    : { all: cache.all, ranges: mergeRanges([...cache.ranges, range]) }
}
