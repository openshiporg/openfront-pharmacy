import { platformRequest } from '@/features/platform/lib/request'
import type { PharmacyAuditTimelineProjection, PharmacyOutboxTimelineProjection } from '@/features/pharmacy/contracts'
import { OperationalPage, type OperationalItem } from '@/features/platform/components/OperationalPage'
import { TransitionPills } from '@/features/platform/components/TransitionPills'
import { replayOutboxEvent } from '../actions'
import { formatDateTime } from '@/features/platform/lib/dates'
import { getStoreTimeZone } from '@/features/platform/lib/store-time-zone'

export async function AuditTimelinePage() {
  const timeZone = await getStoreTimeZone()
  const response = await platformRequest<{
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
            { label: 'Occurred', value: formatDateTime(event.occurredAt, timeZone) },
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
            { label: 'Occurred', value: formatDateTime(event.occurredAt, timeZone) },
            { label: 'Attempts', value: String(event.attempts) },
            { label: 'Replays', value: String(event.replayCount) },
            { label: 'Error', value: event.hasError ? 'Review required' : 'None' },
          ],
          actions: ['failed', 'dead_letter'].includes(event.status) ? <TransitionPills label="Replay delivery" options={[{ label: 'Replay', action: replayOutboxEvent.bind(null, event.id) }]} /> : undefined,
        })),
      ]
    : []

  return <OperationalPage title="Audit log" description="Review audit events and event delivery status." items={items} emptyMessage="No audit events yet" error={response.success ? undefined : response.error} attentionStatuses={['failed', 'dead_letter', 'retry_pending']} />
}
