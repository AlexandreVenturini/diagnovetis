export function formatRecordDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR')
}
