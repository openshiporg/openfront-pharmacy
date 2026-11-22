import { platformRequest } from '@/features/platform/lib/request'
import type { PharmacyPrescriptionQueueProjection } from '@/features/pharmacy/contracts'
import { WorkflowQueuePage, type WorkflowPriority } from '@/features/platform/components/WorkflowQueuePage'
import { reportedAge, strongestPriority } from '@/features/platform/components/workflowQueue'
import { formatCalendarDate, formatDay } from '@/features/platform/lib/dates'
import { plural } from '@/features/platform/lib/plural'
import { willCallDays, willCallException } from '@/features/pharmacy/will-call'

const decisionByStatus: Record<string, { label: string; hint: string }> = {
  draft: { label: 'Complete intake triage', hint: 'Review the reported source, patient, prescriber, and item evidence before recording a pharmacist decision.' },
  pending_review: { label: 'Review prescription', hint: 'Inspect source, identity, prescriber, and fill-specific safety evidence before recording a pharmacist decision.' },
  needs_information: { label: 'Resolve missing evidence', hint: 'Identify the reported evidence gap; no approval or dispense decision is implied.' },
  approved: { label: 'Review dispense readiness', hint: 'Confirm current safety review and eligible lot evidence before preparing a fill.' },
  ready_to_dispense: { label: 'Confirm dispensing decision', hint: 'Complete the authorized human confirmation and current server eligibility checks.' },
  partially_dispensed: { label: 'Review remaining fill', hint: 'Review the recorded fill evidence and current server eligibility before any further dispensing decision.' },
  ready_for_pickup: { label: 'Will-call: hand off or return', hint: 'Filled and labelled. Record the cash pickup at the counter, or return it to stock if it was not collected.' },
  fill_closed: { label: 'Review released fill', hint: 'Unused quantity was released; consumed entitlement is not restored. Review lineage before any further fill.' },
  dispensed: { label: 'Review completed record', hint: 'Inspect the preserved dispensing, payment, and label evidence; no further fill is inferred.' },
  refill_requested: { label: 'Review refill request', hint: 'Review the linked refill request and its current authorization evidence; the software does not authorize another fill.' },
  transfer_requested: { label: 'Review transfer evidence', hint: 'Review the linked transfer request and its recorded consent/source evidence.' },
  rejected: { label: 'Review closed record', hint: 'Inspect the recorded rejection evidence; the queue does not reopen a terminal workflow.' },
  cancelled: { label: 'Review closed record', hint: 'Inspect the recorded cancellation evidence; the queue does not reopen a terminal workflow.' },
}

export async function PrescriptionQueuePage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  const after = typeof params?.after === 'string' ? params.after : null
  const willCall = params?.willCall === '7' || params?.willCall === 'due' ? params.willCall : null
  const scope = !willCall && (params?.scope === 'closed' || params?.scope === 'all') ? params.scope : null
  const query = [willCall ? `willCall=${willCall}` : '', scope ? `scope=${scope}` : ''].filter(Boolean).join('&')
  const response = await platformRequest<{ pharmacyPrescriptionWorklist: { items: PharmacyPrescriptionQueueProjection[]; totalCount: number; hasMore: boolean; nextCursor?: string | null } }>(`query PrescriptionWorklist($first: Int, $after: String, $willCall: String, $scope: String) { pharmacyPrescriptionWorklist(first: $first, after: $after, willCall: $willCall, scope: $scope) { items { id prescriptionNumber status source sourceVerificationStatus createdAt writtenAt patientDisplayName prescriberName prescriberVerificationStatus locationName medicationName quantityPrescribed refillsRemaining openRefillCount openTransferCount readyAt closedAt willCallReturnDays } totalCount hasMore nextCursor } }`, { first: 50, after, willCall, scope })
  const worklist = response.success ? response.data.pharmacyPrescriptionWorklist : null
  const items = worklist ? worklist.items.map((prescription) => {
    const waited = willCallDays(prescription.readyAt)
    const exceptions = [
      prescription.sourceVerificationStatus !== 'human_verified' ? `Source evidence: ${prescription.sourceVerificationStatus.replaceAll('_', ' ')}` : '',
      prescription.prescriberVerificationStatus !== 'validated' ? `Prescriber evidence: ${prescription.prescriberVerificationStatus.replaceAll('_', ' ')}` : '',
      !prescription.medicationName ? 'Medication details missing' : '',
      prescription.openRefillCount ? plural(prescription.openRefillCount, 'pending refill request') : '',
      prescription.openTransferCount ? plural(prescription.openTransferCount, 'pending transfer request') : '',
      willCallException(prescription.readyAt, prescription.willCallReturnDays) || '',
    ].filter(Boolean)
    const statePriority: WorkflowPriority = prescription.status === 'expired' ? 'critical' : ['pending_review', 'needs_information', 'on_hold'].includes(prescription.status) || Boolean(prescription.openRefillCount || prescription.openTransferCount) ? 'attention' : 'routine'
    const priority = strongestPriority(statePriority, exceptions.length ? 'attention' : 'routine')
    const decision = prescription.status === 'dispensed' && prescription.openRefillCount
      ? { label: 'Review refill request', hint: 'Review the linked refill request and current authorization evidence; the software does not authorize another fill.' }
      : prescription.status === 'dispensed' && prescription.openTransferCount
        ? { label: 'Review transfer request', hint: 'Review the linked transfer request and its recorded consent/source evidence.' }
        : decisionByStatus[prescription.status] || { label: 'Review controlled task', hint: 'Review the current server state and available authorized decisions; the queue does not infer permission.' }
    const finished = ['dispensed', 'fill_closed', 'rejected', 'cancelled'].includes(prescription.status) && !prescription.openRefillCount && !prescription.openTransferCount
    const closedOn = prescription.closedAt ? formatDay(prescription.closedAt) : ''
    return {
      id: prescription.id,
      href: `/dashboard/platform/prescriptions/${prescription.id}`,
      title: prescription.prescriptionNumber,
      subtitle: prescription.medicationName || 'No medication details',
      state: prescription.status,
      priority,
      priorityLabel: priority === 'critical' ? 'Immediate review' : priority === 'attention' ? 'Needs attention' : 'Routine review',
      ageLabel: finished ? closedOn || 'Not recorded' : reportedAge(prescription.createdAt),
      // Finished work reads newest first; open work oldest first.
      sortValue: finished && prescription.closedAt ? -new Date(prescription.closedAt).getTime() : prescription.createdAt ? new Date(prescription.createdAt).getTime() : Number.MAX_SAFE_INTEGER,
      location: prescription.locationName,
      exceptions,
      context: [
        { label: 'Patient', value: prescription.patientDisplayName },
        { label: 'Prescriber', value: prescription.prescriberName },
        { label: 'Source', value: `${prescription.source} · ${prescription.sourceVerificationStatus.replaceAll('_', ' ')}` },
        { label: 'Written', value: prescription.writtenAt ? formatCalendarDate(prescription.writtenAt) : 'Not reported' },
        { label: 'Quantity / refills', value: `${prescription.quantityPrescribed ?? 'Not reported'} / ${prescription.refillsRemaining ?? 'Not reported'}` },
        { label: 'Open requests', value: `${prescription.openRefillCount || 0} refill · ${prescription.openTransferCount || 0} transfer` },
        ...(waited !== null ? [{ label: 'Days in will-call', value: plural(waited, 'day') }] : []),
      ],
      nextDecision: finished ? '' : decision.label,
      decisionHint: finished ? '' : decision.hint,
    }
  }) : []
  const nextPageHref = worklist?.hasMore && worklist.nextCursor ? `/dashboard/platform/prescriptions?${query ? `${query}&` : ''}after=${encodeURIComponent(worklist.nextCursor)}` : undefined
  return <WorkflowQueuePage title="Prescriptions" description="Review prescriptions, refills, and transfers." items={items} totalCount={worklist?.totalCount} previousPageHref={after ? `/dashboard/platform/prescriptions${query ? `?${query}` : ''}` : undefined} statusTabs={{ param: 'scope', label: 'Show', allLabel: 'Open work', value: scope, options: [['closed', 'Completed'], ['all', 'All']] }} finished={scope === 'closed' ? { ageHeader: 'Closed' } : undefined} filters={scope ? [] : [{ param: 'willCall', label: 'Will-call', allLabel: 'Any wait', value: willCall, options: [['7', 'Will-call over 7 days'], ['due', 'Past return date']] }]} nextPageHref={nextPageHref} emptyMessage={scope === 'closed' ? 'No completed prescriptions' : scope === 'all' ? 'No prescriptions yet' : 'No open prescription work'} error={response.success ? undefined : response.error} primaryAction={{ href: '/dashboard/platform/prescriptions/intake', label: 'New prescription' }} />
}
