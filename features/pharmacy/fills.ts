export type PharmacyFill = {
  id: string; prescriptionItemId: string; refillRequestId?: string | null; kind: string; status: string; version: number; fillNumber: number;
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
export const fillWorkbenchSelection = 'organizationId policyConfigured canConfigure items { id itemVersion lineage originalReservable } totalCount hasMore nextCursor fills { id prescriptionItemId refillRequestId kind status version fillNumber creditState authorizedQuantity quantityDispensed quantityReleased quantityRemaining expiresAt policyVersion policyReference allowPartial releaseReasons priceAmount taxAmount currencyCode taxable itemVersion events { id action version quantity occurredAt actorName reason orderId orderNumber } hasMoreEvents }'
