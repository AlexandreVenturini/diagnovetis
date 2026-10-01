import { noIntervalo, type Intervalo } from '../shared/periodo'
import type { ResumoProntuario } from './ListaProntuarios'

export type ItemResumo = {
  key: string
  consultaId: number | null
  data: string
  veterinario: string
  pet: { id: number; nomePet: string; nomeTutor: string; raca: string; peso: string }
}

export function resumirProntuarios(
  itens: ItemResumo[],
  busca: string,
  intervalo: Intervalo | null,
): ResumoProntuario[] {
  const buscaNormalizada = busca.trim().toLocaleLowerCase('pt-BR')
  const porPet = new Map<number, ResumoProntuario>()
  for (const item of itens) {
    if (!buscaNormalizada && (item.consultaId === null || !noIntervalo(item.data, intervalo))) continue
    if (
      buscaNormalizada &&
      !`${item.pet.nomePet} ${item.pet.nomeTutor}`.toLocaleLowerCase('pt-BR').includes(buscaNormalizada)
    )
      continue
    const atual = porPet.get(item.pet.id) ?? { ...item.pet, totalAtendimentos: 0, ultimoAtendimento: null }
    if (item.consultaId !== null) {
      atual.totalAtendimentos += 1
      if (!atual.ultimoAtendimento || item.data > atual.ultimoAtendimento.data)
        atual.ultimoAtendimento = { data: item.data, veterinario: item.veterinario }
    }
    porPet.set(item.pet.id, atual)
  }
  return [...porPet.values()].sort(
    (a, b) =>
      (b.ultimoAtendimento?.data ?? '').localeCompare(a.ultimoAtendimento?.data ?? '') ||
      a.nomePet.localeCompare(b.nomePet, 'pt-BR'),
  )
}
