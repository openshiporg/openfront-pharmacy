export const BLOCKING_RECALL_STATUSES = new Set(['active', 'quarantined'])

export type LotEligibilityInput = {
  status?: string | null
  expirationDate?: string | Date | null
  quantityAvailable?: number | null
  quantityQuarantined?: number | null
  coldChainRequired?: boolean | null
  coldChainEvidenceComplete?: boolean | null
  recalls?: Array<{ status?: string | null }> | null
}

export function lotHasBlockingRecall(lot: LotEligibilityInput) {
  return Boolean(lot.recalls?.some((recall) => BLOCKING_RECALL_STATUSES.has(String(recall.status))))
}

export function eligibleLotQuantity(lot: LotEligibilityInput, now = Date.now()) {
  if (lot.status !== 'available') return 0
  if (!lot.expirationDate || new Date(lot.expirationDate).getTime() <= now) return 0
  if (lot.coldChainRequired && !lot.coldChainEvidenceComplete) return 0
  if (lotHasBlockingRecall(lot)) return 0
  return Math.max(0, Number(lot.quantityAvailable || 0) - Number(lot.quantityQuarantined || 0))
}

export function isLotEligible(lot: LotEligibilityInput, now = Date.now()) {
  return eligibleLotQuantity(lot, now) > 0
}
