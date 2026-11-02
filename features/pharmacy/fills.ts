export type PharmacyFill = {
  id: string; prescriptionItemId: string; refillRequestId?: string | null; kind: string; status: string; version: number; fillNumber: number; attempt: number;
  creditState: string; authorizedQuantity: number; quantityDispensed: number; quantityReleased: number; quantityRemaining: number;
  expiresAt: string; policyVersion: string; policyReference: string; allowPartial: boolean; releaseReasons: string[];
  priceAmount: number; taxAmount: number; currencyCode: string; taxable: boolean; itemVersion: string;
  events: Array<{ id: string; action: string; version: number; quantity: number; occurredAt: string; actorName: string; reason?: string | null; orderId?: string | null; orderNumber?: string | null }>;
  hasMoreEvents: boolean;
}
export type PharmacyFillWorkbench = {
  organizationId: string; policyConfigured: boolean; canConfigure: boolean;
  items: Array<{ id: string; itemVersion: string; lineage: string; originalReservable: boolean }>;
  fills: PharmacyFill[]; totalCount: number; hasMore: boolean; nextCursor?: string | null;
}
export const fillWorkbenchSelection = 'organizationId policyConfigured canConfigure items { id itemVersion lineage originalReservable } totalCount hasMore nextCursor fills { id prescriptionItemId refillRequestId kind status version fillNumber attempt creditState authorizedQuantity quantityDispensed quantityReleased quantityRemaining expiresAt policyVersion policyReference allowPartial releaseReasons priceAmount taxAmount currencyCode taxable itemVersion events { id action version quantity occurredAt actorName reason orderId orderNumber } hasMoreEvents }'

const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th'}`

/**
 * Display name for a fill. A fill returned to stock gives its refill back, so the next fill
 * reuses the same fill number (the Rx-system "refill #" stays the patient's entitlement index).
 * Repeats are told apart by attempt, and a returned fill says so.
 */
export function fillLabel(fill: Pick<PharmacyFill, 'fillNumber' | 'attempt' | 'status'> & { events?: Array<{ action: string }> }) {
  const base = `Fill ${fill.fillNumber}${fill.attempt > 1 ? ` (${ordinal(fill.attempt)})` : ''}`
  return fill.status === 'released' && fill.events?.some((event) => event.action === 'returned_to_stock') ? `${base} · returned` : base
}
