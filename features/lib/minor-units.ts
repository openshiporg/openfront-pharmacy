// Adapted from the Restaurant currency-units seam: reject, never round, excess
// precision. Pharmacy cash surfaces explicitly use USD (2 minor-unit digits).
export const MAX_MINOR_UNITS = 2_147_483_647
export function decimalToMinorUnits(input: string, max = MAX_MINOR_UNITS): number | null {
  const value = input.trim()
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(value)) return null
  const [whole, fraction = ''] = value.split('.')
  const amount = BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, '0'))
  if (amount > BigInt(max)) return null
  return Number(amount)
}
export function assertMinorUnits(value: number, label = 'Amount') {
  if (!Number.isSafeInteger(value) || value < 0 || value > MAX_MINOR_UNITS) throw new Error(`${label} must be bounded non-negative integer minor units`)
  return value
}
