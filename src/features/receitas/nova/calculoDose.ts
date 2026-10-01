export function calcularDose(peso: number, dosePorKg: number, concentracao: number) {
  if (![peso, dosePorKg, concentracao].every((valor) => Number.isFinite(valor) && valor > 0)) return null
  const mg = peso * dosePorKg
  const ml = mg / concentracao
  return Number.isFinite(mg) && Number.isFinite(ml) ? { mg, ml } : null
}
