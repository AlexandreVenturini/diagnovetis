export type VisaoPeriodo = 'dia' | 'semana' | 'mes' | 'ano' | 'tudo'
export type Periodo = { visao: VisaoPeriodo; data: string }
export type Intervalo = { inicio: string; fim: string }

export const VISOES_PERIODO: { visao: VisaoPeriodo; rotulo: string }[] = [
  { visao: 'dia', rotulo: 'Dia' },
  { visao: 'semana', rotulo: 'Semana' },
  { visao: 'mes', rotulo: 'Mês' },
  { visao: 'ano', rotulo: 'Ano' },
  { visao: 'tudo', rotulo: 'Tudo' },
]

export const dataParaCampo = (data = new Date()) =>
  `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`
const interpretar = (data: string) => new Date(`${data}T12:00:00`)

export function somarDias(data: string, quantidade: number) {
  const proximo = interpretar(data)
  proximo.setDate(proximo.getDate() + quantidade)
  return dataParaCampo(proximo)
}

export function limitesPeriodo(data: string, visao: Exclude<VisaoPeriodo, 'tudo'>): Intervalo {
  const inicio = interpretar(data)
  if (visao === 'semana') inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7))
  if (visao === 'mes') inicio.setDate(1)
  if (visao === 'ano') inicio.setMonth(0, 1)
  const fim = new Date(inicio)
  if (visao === 'semana') fim.setDate(fim.getDate() + 6)
  if (visao === 'mes') fim.setMonth(fim.getMonth() + 1, 0)
  if (visao === 'ano') fim.setMonth(11, 31)
  return { inicio: dataParaCampo(inicio), fim: dataParaCampo(fim) }
}

export function intervaloPeriodo(valor: Periodo): Intervalo | null {
  return valor.visao === 'tudo' ? null : limitesPeriodo(valor.data, valor.visao)
}

export function deslocarPeriodo(data: string, visao: VisaoPeriodo, quantidade: number) {
  const proximo = interpretar(data)
  if (visao === 'ano') proximo.setFullYear(proximo.getFullYear() + quantidade, 0, 1)
  else if (visao === 'mes') proximo.setMonth(proximo.getMonth() + quantidade, 1)
  else if (visao === 'semana') proximo.setDate(proximo.getDate() + quantidade * 7)
  else if (visao === 'dia') proximo.setDate(proximo.getDate() + quantidade)
  return dataParaCampo(proximo)
}

export function rotuloPeriodo(data: string, visao: VisaoPeriodo) {
  const formatar = (valor: string, opcoes: Intl.DateTimeFormatOptions) =>
    interpretar(valor).toLocaleDateString('pt-BR', opcoes)
  if (visao === 'tudo') return 'Todo o período'
  if (visao === 'dia') return formatar(data, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
  if (visao === 'mes') return formatar(data, { month: 'long', year: 'numeric' })
  if (visao === 'ano') return formatar(data, { year: 'numeric' })
  const { inicio, fim } = limitesPeriodo(data, visao)
  return `${formatar(inicio, { day: '2-digit', month: 'short' })} — ${formatar(fim, { day: '2-digit', month: 'short', year: 'numeric' })}`
}

export function nomePeriodo(visao: VisaoPeriodo) {
  return { dia: 'do dia', semana: 'da semana', mes: 'do mês', ano: 'do ano', tudo: 'de todo o período' }[visao]
}

export function noIntervalo(data: string, intervalo: Intervalo | null) {
  if (!intervalo) return true
  return Boolean(data) && data >= intervalo.inicio && data <= intervalo.fim
}

export function inicioIntervaloIso(intervalo: Intervalo) {
  return new Date(`${intervalo.inicio}T00:00:00`).toISOString()
}

export function fimIntervaloIso(intervalo: Intervalo) {
  return new Date(`${intervalo.fim}T23:59:59.999`).toISOString()
}

export function mesclarIntervalos(intervalos: Intervalo[]): Intervalo[] {
  const ordenados = [...intervalos].sort((a, b) => a.inicio.localeCompare(b.inicio))
  const mesclados: Intervalo[] = []
  for (const intervalo of ordenados) {
    const ultimo = mesclados.at(-1)
    if (ultimo && intervalo.inicio <= somarDias(ultimo.fim, 1)) {
      if (intervalo.fim > ultimo.fim) ultimo.fim = intervalo.fim
    } else {
      mesclados.push({ ...intervalo })
    }
  }
  return mesclados
}

export function intervalosFaltando(carregado: Intervalo[], intervalo: Intervalo): Intervalo[] {
  const lacunas: Intervalo[] = []
  let posicao = intervalo.inicio
  for (const bloco of mesclarIntervalos(carregado)) {
    if (bloco.fim < posicao) continue
    if (bloco.inicio > intervalo.fim) break
    if (bloco.inicio > posicao) lacunas.push({ inicio: posicao, fim: somarDias(bloco.inicio, -1) })
    posicao = somarDias(bloco.fim, 1)
    if (posicao > intervalo.fim) return lacunas
  }
  if (posicao <= intervalo.fim) lacunas.push({ inicio: posicao, fim: intervalo.fim })
  return lacunas
}

export type CacheIntervalos = { todos: boolean; intervalos: Intervalo[] }

export function intervalosParaBuscar(cache: CacheIntervalos, intervalo: Intervalo | null): (Intervalo | null)[] {
  if (cache.todos) return []
  return intervalo === null ? [null] : intervalosFaltando(cache.intervalos, intervalo)
}

export function marcarCarregado(cache: CacheIntervalos, intervalo: Intervalo | null): CacheIntervalos {
  return intervalo === null
    ? { todos: true, intervalos: cache.intervalos }
    : { todos: cache.todos, intervalos: mesclarIntervalos([...cache.intervalos, intervalo]) }
}
