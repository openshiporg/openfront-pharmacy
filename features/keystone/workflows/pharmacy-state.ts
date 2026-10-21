const prescriptionTransitions: Record<string, readonly string[]> = {
  draft: ['pending_review', 'cancelled'],
  pending_review: ['needs_information', 'approved', 'rejected', 'cancelled'],
  needs_information: ['pending_review', 'cancelled'],
  approved: ['ready_to_dispense', 'fill_closed', 'cancelled'],
  ready_to_dispense: ['approved', 'partially_dispensed', 'dispensed', 'fill_closed', 'cancelled'],
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
