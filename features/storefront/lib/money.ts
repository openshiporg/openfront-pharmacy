export function formatMoney(amount: number, currencyCode = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode || 'USD' }).format(amount / 100)
}

export function formatStatus(status: string) {
  return status.replaceAll('_', ' ')
}

export function formatAddress(address: Record<string, unknown> | null | undefined) {
  if (!address) return ''
  return [address.line1, address.line2, address.city, address.region, address.postalCode]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(', ')
}
