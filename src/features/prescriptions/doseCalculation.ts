export function calculateDose(weight: number, dosePerKg: number, concentration: number) {
  if (![weight, dosePerKg, concentration].every(value => Number.isFinite(value) && value > 0)) return null
  const mg = weight * dosePerKg
  const ml = mg / concentration
  return Number.isFinite(mg) && Number.isFinite(ml) ? { mg, ml } : null
}
