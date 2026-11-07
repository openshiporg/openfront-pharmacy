const prescriptionTransitions: Record<string, readonly string[]> = {
  draft: ['pending_review', 'cancelled'],
  pending_review: ['needs_information', 'approved', 'rejected', 'cancelled'],
  needs_information: ['pending_review', 'cancelled'],
  approved: ['ready_to_dispense', 'fill_closed', 'cancelled'],
  ready_to_dispense: ['approved', 'partially_dispensed', 'ready_for_pickup', 'dispensed', 'fill_closed', 'cancelled'],
  // Will-call bin: filled and labelled, waiting for the patient. Picked up -> dispensed;
  // returned to stock -> fill_closed.
  ready_for_pickup: ['dispensed', 'fill_closed', 'cancelled'],
  partially_dispensed: ['approved', 'partially_dispensed', 'dispensed', 'fill_closed', 'cancelled'],
  rejected: [],
  dispensed: ['approved', 'cancelled'],
  fill_closed: ['approved', 'cancelled'],
  cancelled: [],
}

const terminalPrescriptionStatuses = new Set(['rejected', 'cancelled'])

export function isTerminalPrescriptionStatus(status: string) {
  return terminalPrescriptionStatuses.has(status)
}

export function assertPrescriptionTransition(previousStatus: string, nextStatus: string) {
  if (previousStatus === nextStatus) return
  if (isTerminalPrescriptionStatus(previousStatus)) {
    throw new Error(`Prescription status ${previousStatus} is terminal`)
  }
  if (!prescriptionTransitions[previousStatus]?.includes(nextStatus)) {
    throw new Error(`Invalid prescription transition: ${previousStatus} -> ${nextStatus}`)
  }
}

const recallTransitions: Record<string, readonly string[]> = {
  draft: ['active', 'cancelled'],
  active: ['quarantined', 'cancelled'],
  quarantined: ['resolved', 'closed'],
  resolved: ['closed'],
  closed: [],
  cancelled: [],
}

export function assertRecallTransition(previousStatus: string, nextStatus: string) {
  if (previousStatus === nextStatus) return
  if (!recallTransitions[previousStatus]?.includes(nextStatus)) {
    throw new Error(`Invalid recall transition: ${previousStatus} -> ${nextStatus}`)
  }
}

export function assertAuthorizedHumanApproval(input: {
  actorId?: string | null
  attested?: boolean | null
  reason?: string | null
}) {
  if (!input.actorId?.trim()) {
    throw new Error('An authenticated authorized human is required')
  }
  if (input.attested !== true) {
    throw new Error('Explicit human attestation is required')
  }
  if (!input.reason?.trim() || input.reason.trim().length < 8) {
    throw new Error('A meaningful approval reason is required')
  }
}

export function assertDispensingEvidence(input: {
  pharmacistReviewId?: string | null
  humanApprovalId?: string | null
  prescriptionStatus?: string | null
}) {
  if (input.prescriptionStatus !== 'ready_to_dispense') {
    throw new Error('Prescription must be ready to dispense')
  }
  if (!input.pharmacistReviewId || !input.humanApprovalId) {
    throw new Error('Pharmacist review and authorized-human approval are required')
  }
}

/** Checkout payment session. A late provider event may only move it forward along these edges. */
export const PAYMENT_SESSION_TRANSITIONS: Readonly<Record<string, readonly string[]>> = {
  pending: ['requires_action', 'authorized', 'captured', 'settled_unordered', 'failed', 'cancelled'],
  requires_action: ['pending', 'authorized', 'captured', 'settled_unordered', 'failed', 'cancelled'],
  authorized: ['captured', 'settled_unordered', 'failed', 'cancelled'],
  // Money arrived but no order exists yet: it becomes an order payment, or is refunded.
  settled_unordered: ['captured', 'compensation_pending', 'compensated'],
  captured: [],
  compensation_pending: ['compensated'],
  compensated: [],
  // A success that arrives after a failure or cancel is real money and must surface for reconciliation.
  failed: ['settled_unordered'],
  cancelled: ['settled_unordered'],
}

export function canMovePaymentSession(from: string, to: string) {
  return from === to || Boolean(PAYMENT_SESSION_TRANSITIONS[from]?.includes(to))
}

/** Order payment. Refund is the only way out of captured. */
export const PAYMENT_TRANSITIONS: Readonly<Record<string, readonly string[]>> = {
  pending: ['authorized', 'captured', 'failed', 'cancelled'],
  authorized: ['captured', 'failed', 'cancelled'],
  captured: ['refund_pending', 'refunded'],
  refund_pending: ['refunded'],
  refunded: [],
  failed: [],
  cancelled: [],
}

export function canMovePayment(from: string, to: string) {
  return from === to || Boolean(PAYMENT_TRANSITIONS[from]?.includes(to))
}

/** Lot statuses a cold-chain excursion may quarantine. A recalled, expired or empty lot keeps its stronger status. */
export const QUARANTINABLE_LOT_STATUSES: readonly string[] = ['available', 'quarantined']

/** Status a lot takes after an inventory count sets its quantity. Returns null to leave it unchanged. */
export function lotStatusAfterAdjustment(current: string, targetQuantity: number): string | null {
  if (targetQuantity === 0) return ['available', 'depleted'].includes(current) ? 'depleted' : null
  return current === 'depleted' ? 'available' : null
}
