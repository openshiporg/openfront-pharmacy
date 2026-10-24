import { platformRequest } from '@/features/platform/lib/request'
import type { PharmacyRecallQueueProjection } from '@/features/pharmacy/contracts'
import { WorkflowQueuePage, type WorkflowPriority } from '@/features/platform/components/WorkflowQueuePage'
import { reportedAge, strongestPriority } from '@/features/platform/components/workflowQueue'

function recallDecision(recall: PharmacyRecallQueueProjection) {
  if (!recall.approvalRecorded) return { label: 'Review source approval', hint: 'Confirm the named source and authorized human approval before acting on the reported classification.' }
  if (recall.status === 'active') return { label: 'Quarantine affected lots', hint: 'Review current custody and record the controlled quarantine decision in the recall task.' }
  if (recall.quarantinedLotCount < recall.affectedLotCount) return { label: 'Review lot protection gap', hint: 'Inspect the current lot state before any authorized quarantine or physical disposition decision.' }
  if (recall.unresolvedExposureCount > 0) return { label: 'Record exposure outreach', hint: 'Record operator-performed outreach evidence; the software does not infer patient contact or outcome.' }
  if (recall.status === 'quarantined') return { label: 'Record physical lot disposition', hint: 'Review each protected lot and record its physical disposition before recall closure.' }
  if (recall.status === 'resolved') return { label: 'Review closure evidence', hint: 'Confirm the recorded lot disposition and exposure outcomes before the authorized closure decision.' }
  return { label: 'Review recall evidence', hint: 'Inspect the current server state and preserved decision trail.' }
}

export async function RecallQueuePage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  const after = typeof params?.after === 'string' ? params.after : null
  const response = await platformRequest<{ pharmacyRecallWorklist: { items: PharmacyRecallQueueProjection[]; totalCount: number; hasMore: boolean; nextCursor?: string | null } }>(`query RecallWorklist($first: Int, $after: String) { pharmacyRecallWorklist(first: $first, after: $after) { items { id recallNumber classification status reason source initiatedAt locationName affectedLotCount quarantinedLotCount unresolvedExposureCount approvalRecorded approvedAt approvedBy } totalCount hasMore nextCursor } }`, { first: 50, after })
  const worklist = response.success ? response.data.pharmacyRecallWorklist : null
  const items = worklist ? worklist.items.map((recall) => {
    const exceptions = [
      !recall.approvalRecorded ? 'Authorized source approval is not recorded' : '',
      recall.quarantinedLotCount < recall.affectedLotCount ? `${recall.affectedLotCount - recall.quarantinedLotCount} affected lot(s) not reported quarantined` : '',
      recall.unresolvedExposureCount > 0 ? `${recall.unresolvedExposureCount} dispensed exposure(s) require recorded outreach` : '',
      !recall.source ? 'Recall source missing' : '',
    ].filter(Boolean)
    const isClosed = ['closed', 'resolved'].includes(recall.status)
    const isClassOne = recall.classification === 'class_i'
    const classificationPriority: WorkflowPriority = !isClosed && isClassOne ? 'critical' : !isClosed ? 'attention' : 'routine'
    const statePriority: WorkflowPriority = isClosed ? 'routine' : 'attention'
    const priority = strongestPriority(classificationPriority, statePriority, exceptions.length ? 'attention' : 'routine')
    const decision = recallDecision(recall)
    return {
      id: recall.id,
      href: `/dashboard/platform/recalls/${recall.id}`,
      title: recall.recallNumber,
      subtitle: recall.reason,
      state: recall.status,
      priority,
      priorityLabel: priority === 'critical' ? 'Highest recall priority' : recall.status === 'closed' ? 'Closed evidence' : 'Active recall',
      ageLabel: reportedAge(recall.initiatedAt),
      sortValue: new Date(recall.initiatedAt).getTime(),
      location: recall.locationName || 'Organization-wide',
      exceptions,
      context: [
        { label: 'Classification', value: recall.classification },
        { label: 'Affected / protected', value: `${recall.affectedLotCount} / ${recall.quarantinedLotCount}` },
        { label: 'Exposure outreach', value: recall.unresolvedExposureCount ? `${recall.unresolvedExposureCount} unresolved` : 'No unresolved exposure reported' },
        { label: 'Source', value: recall.source || 'Not reported' },
        { label: 'Approval', value: recall.approvedBy || (recall.approvalRecorded ? 'Recorded' : 'Not recorded') },
      ],
      nextDecision: decision.label,
      decisionHint: decision.hint,
    }
  }) : []
  const nextPageHref = worklist?.hasMore && worklist.nextCursor ? `/dashboard/platform/recalls?after=${encodeURIComponent(worklist.nextCursor)}` : undefined
  return <WorkflowQueuePage title="Recalls" description="Track recalls, quarantined lots, and patient outreach." items={items} totalCount={worklist?.totalCount} previousPageHref={after ? '/dashboard/platform/recalls' : undefined} nextPageHref={nextPageHref} emptyMessage="No recalls yet" error={response.success ? undefined : response.error} primaryAction={{ href: '/dashboard/platform/recalls/open', label: 'Open recall' }} />
}
