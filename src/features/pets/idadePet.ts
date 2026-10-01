export function interpretarIdadePet(idade: string) {
  const valor = idade.trim()
  if (!valor) return { anos: '', meses: '' }
  if (/^\d+$/.test(valor)) return { anos: valor, meses: '0' }
  const anos = valor.match(/(\d+)\s*anos?/i)?.[1]
  const meses = valor.match(/(\d+)\s*m(?:ês|eses)/i)?.[1]
  return { anos: anos ?? '0', meses: meses ?? '0' }
}

export function serializarIdadePet(anos: string, meses: string): string {
  const y = Number(anos)
  const m = Number(meses)
  if (
    (!anos.trim() && !meses.trim()) ||
    !Number.isSafeInteger(y) ||
    y < 0 ||
    !Number.isSafeInteger(m) ||
    m < 0 ||
    m > 11
  ) {
    throw new Error('Informe a idade em anos inteiros e meses de 0 a 11.')
  }
  const partes: string[] = []
  if (y > 0) partes.push(`${y} ${y === 1 ? 'ano' : 'anos'}`)
  if (m > 0 || y === 0) partes.push(`${m} ${m === 1 ? 'mês' : 'meses'}`)
  return partes.join(' e ')
}

export function formatarIdadePet(idade: string): string {
  const valor = idade.trim()
  if (!valor) return 'Não informada'
  return /^\d+$/.test(valor) ? serializarIdadePet(valor, '0') : valor
}
