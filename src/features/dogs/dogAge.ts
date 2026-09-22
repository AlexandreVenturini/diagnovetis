export function parseDogAge(age: string) {
  const value = age.trim()
  if (!value) return { years: '', months: '' }
  if (/^\d+$/.test(value)) return { years: value, months: '0' }
  const years = value.match(/(\d+)\s*anos?/i)?.[1]
  const months = value.match(/(\d+)\s*m(?:ês|eses)/i)?.[1]
  return { years: years ?? '0', months: months ?? '0' }
}

export function serializeDogAge(years: string, months: string): string {
  const y = Number(years)
  const m = Number(months)
  if ((!years.trim() && !months.trim()) || !Number.isSafeInteger(y) || y < 0 || !Number.isSafeInteger(m) || m < 0 || m > 11) {
    throw new Error('Informe a idade em anos inteiros e meses de 0 a 11.')
  }
  const parts: string[] = []
  if (y > 0) parts.push(`${y} ${y === 1 ? 'ano' : 'anos'}`)
  if (m > 0 || y === 0) parts.push(`${m} ${m === 1 ? 'mês' : 'meses'}`)
  return parts.join(' e ')
}

export function formatDogAge(age: string): string {
  const value = age.trim()
  if (!value) return 'Não informada'
  return /^\d+$/.test(value) ? serializeDogAge(value, '0') : value
}
