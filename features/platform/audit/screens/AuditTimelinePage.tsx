import { keystoneClient } from '@/features/dashboard/lib/keystoneClient'
import type { PharmacyAuditTimelineProjection, PharmacyOutboxTimelineProjection } from '@/features/pharmacy/contracts'
import { OperationalPage, type OperationalItem } from '@/features/platform/components/OperationalPage'

export async function AuditTimelinePage() {
  const response = await keystoneClient<{
    pharmacyAuditTimeline: PharmacyAuditTimelineProjection[]
    pharmacyOutboxTimeline: PharmacyOutboxTimelineProjection[]
  }>(`query { pharmacyAuditTimeline(take: 75) { id eventKey eventType resourceType resourceId occurredAt actorType actorName locationName } pharmacyOutboxTimeline(take: 75) { id eventKey eventType aggregateType aggregateId status attempts replayCount occurredAt processedAt hasError } }`)

  const items: OperationalItem[] = response.success
    ? [
        ...response.data.pharmacyAuditTimeline.map((event) => ({
          id: `audit:${event.id}`,
          title: event.eventType,
          subtitle: `${event.resourceType} · ${event.resourceId}`,
          status: 'recorded',
          details: [
            { label: 'Occurred', value: new Date(event.occurredAt).toLocaleString() },
            { label: 'Actor', value: event.actorName || event.actorType },
            { label: 'Location', value: event.locationName || 'Organization-wide' },
            { label: 'Event key', value: event.eventKey || 'Legacy event' },
          ],
        })),
        ...response.data.pharmacyOutboxTimeline.map((event) => ({
          id: `outbox:${event.id}`,
          title: `Delivery · ${event.eventType}`,
          subtitle: `${event.aggregateType} · ${event.aggregateId}`,
          status: event.status,
          details: [
            { label: 'Occurred', value: new Date(event.occurredAt).toLocaleString() },
            { label: 'Attempts', value: String(event.attempts) },
            { label: 'Replays', value: String(event.replayCount) },
            { label: 'Error', value: event.hasError ? 'Review required' : 'None' },
          ],
        })),
      ]
    : []

  return <OperationalPage title="Audit log" description="Review audit events and event delivery status." items={items} emptyMessage="No audit events yet" error={response.success ? undefined : response.error} attentionStatuses={['failed', 'dead_letter', 'retry_pending']} />
}
