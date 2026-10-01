export function formatarDataAtendimento(data: string) {
  return new Date(`${data}T12:00:00`).toLocaleDateString('pt-BR')
}
