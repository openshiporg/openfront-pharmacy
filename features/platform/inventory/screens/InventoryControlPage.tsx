import { platformRequest } from '@/features/platform/lib/request'
import type { PharmacyInventoryLotProjection, PharmacyInventoryWorklistProjection } from '@/features/pharmacy/contracts'
import { WorkflowQueuePage, type WorkflowPriority } from '@/features/platform/components/WorkflowQueuePage'
import { expiryContext, strongestPriority } from '@/features/platform/components/workflowQueue'
import { formatCalendarDate } from '@/features/platform/lib/dates'

const inventoryStatuses = [
  ['available', 'Available'],
  ['quarantined', 'Quarantined'],
  ['expired', 'Expired'],
  ['recalled', 'Recalled'],
  ['depleted', 'Depleted'],
] as const

function inventoryDecision(lot: PharmacyInventoryLotProjection) {
  if (lot.activeRecallCount > 0) return { label: 'Review recall-linked lot', hint: 'Open the lot evidence before any quarantine or physical disposition decision.' }
  if (lot.openExcursionCount > 0) return { label: 'Resolve excursion evidence', hint: 'Review the reported excursion; no release eligibility is inferred in the queue.' }
  if (lot.quantityQuarantined > 0 || ['quarantined', 'hold'].includes(lot.status)) return { label: 'Review quarantine state', hint: 'Confirm current custody and movement evidence before an authorized adjustment.' }
  return { label: 'Review count decision', hint: 'Inspect immutable movement evidence before recording an authorized inventory adjustment.' }
}

export async function InventoryControlPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  const after = typeof params?.after === 'string' && params.after ? params.after : null
  const status = typeof params?.status === 'string' && params.status ? params.status : null
  const response = await platformRequest<{ pharmacyInventoryQueue: PharmacyInventoryWorklistProjection }>(
    `query InventoryWorklist($first: Int, $after: String, $status: String) { pharmacyInventoryQueue(first: $first, after: $after, status: $status) { items { id lotNumber status expirationDate quantityAvailable quantityQuarantined coldChainRequired coldChainEvidenceComplete storageBin productTitle productSku locationName activeRecallCount openExcursionCount } totalCount hasMore nextCursor } }`,
    { first: 50, after, status },
  )
  const worklist = response.success ? response.data.pharmacyInventoryQueue : null
  const items = worklist ? worklist.items.map((lot) => {
    const expiry = expiryContext(lot.expirationDate)
    const exceptions = [
      expiry.exception || '',
      lot.activeRecallCount > 0 ? `${lot.activeRecallCount} active recall link(s)` : '',
      lot.openExcursionCount > 0 ? `${lot.openExcursionCount} open excursion(s)` : '',
      lot.quantityQuarantined > 0 ? `${lot.quantityQuarantined} unit(s) quarantined` : '',
      lot.coldChainRequired ? (lot.coldChainEvidenceComplete ? 'Cold-chain lot' : 'Cold-chain evidence missing') : '',
    ].filter(Boolean)
    const statePriority: WorkflowPriority = ['recalled', 'expired'].includes(lot.status) || lot.activeRecallCount > 0 || (lot.coldChainRequired && !lot.coldChainEvidenceComplete) ? 'critical' : ['quarantined', 'hold'].includes(lot.status) || lot.openExcursionCount > 0 ? 'attention' : 'routine'
    const priority = strongestPriority(statePriority, expiry.priority)
    const decision = inventoryDecision(lot)
    return {
      id: lot.id,
      href: `/dashboard/platform/inventory/${lot.id}`,
      title: `${lot.productTitle} · ${lot.lotNumber}`,
      subtitle: `${lot.productSku || 'No SKU'} · ${lot.storageBin || 'Storage bin not recorded'}`,
      state: lot.status,
      priority,
      priorityLabel: priority === 'critical' ? 'Hold / recall first' : priority === 'attention' ? 'Review soon' : 'FEFO routine',
      ageLabel: expiry.label,
      sortValue: lot.expirationDate ? new Date(lot.expirationDate).getTime() : Number.MAX_SAFE_INTEGER,
      location: lot.locationName,
      exceptions,
      context: [
        { label: 'Available', value: String(lot.quantityAvailable) },
        { label: 'Quarantined', value: String(lot.quantityQuarantined) },
        { label: 'Expiration', value: lot.expirationDate ? formatCalendarDate(lot.expirationDate) : 'Not reported' },
        { label: 'Recall / excursion', value: `${lot.activeRecallCount} / ${lot.openExcursionCount}` },
      ],
      nextDecision: decision.label,
      decisionHint: decision.hint,
    }
  }) : []
  const filters = new URLSearchParams()
  if (status) filters.set('status', status)
  const filterQuery = filters.toString()
  const baseHref = `/dashboard/platform/inventory${filterQuery ? `?${filterQuery}` : ''}`
  const nextPageHref = worklist?.hasMore && worklist.nextCursor
    ? `${baseHref}${filterQuery ? '&' : '?'}after=${encodeURIComponent(worklist.nextCursor)}`
    : undefined
  return <WorkflowQueuePage title="Inventory" description="Manage lots, expiry, quarantine, and stock by location." items={items} totalCount={worklist?.totalCount} previousPageHref={after ? baseHref : undefined} nextPageHref={nextPageHref} filters={[
    { param: 'status', label: 'Status', allLabel: 'All statuses', value: status, options: inventoryStatuses },
  ]} emptyMessage="No inventory lots yet" error={response.success ? undefined : response.error} primaryAction={{ href: '/dashboard/platform/inventory/receive', label: 'Receive lot' }} />
}
