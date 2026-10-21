export function recallExposureMovementWhere(lotIds: string[]) {
  return {
    lot: { id: { in: lotIds } },
    movementType: { in: ['dispense', 'sale'] },
    quantityDelta: { lt: 0 },
  }
}

export function unlinkedRecallExposureCount(candidateMovementCount: number, linkedMovementCount: number) {
  if (!Number.isInteger(candidateMovementCount) || candidateMovementCount < 0 || !Number.isInteger(linkedMovementCount) || linkedMovementCount < 0) {
    throw new Error('Recall exposure counts must be non-negative integers')
  }
  return Math.max(0, candidateMovementCount - linkedMovementCount)
}

export function assessRecallExposureReconciliation(input: { candidateMovementCount: number; linkedMovementIds: string[]; exposureCount: number; linkedExposureCount: number }) {
  const counts = [input.candidateMovementCount, input.exposureCount, input.linkedExposureCount]
  if (counts.some((value) => !Number.isInteger(value) || value < 0)) throw new Error('Recall exposure counts must be non-negative integers')
  const linkedMovementCount = new Set(input.linkedMovementIds).size
  return {
    linkedMovementCount,
    unlinkedExposureCount: unlinkedRecallExposureCount(input.candidateMovementCount, linkedMovementCount),
    exposureReconciliationComplete: input.candidateMovementCount === linkedMovementCount
      && input.exposureCount === input.linkedExposureCount
      && input.linkedExposureCount === linkedMovementCount,
  }
}
