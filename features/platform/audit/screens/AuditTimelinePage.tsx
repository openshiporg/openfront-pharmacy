import { platformRequest } from '@/features/platform/lib/request'
import type { PharmacyAuditTimelineProjection } from '@/features/pharmacy/contracts'
import { OperationalPage, type OperationalItem } from '@/features/platform/components/OperationalPage'
import { formatDateTime } from '@/features/platform/lib/dates'
import { getStoreTimeZone } from '@/features/platform/lib/store-time-zone'

export async function AuditTimelinePage() {
  const timeZone = await getStoreTimeZone()
  const response = await platformRequest<{
    pharmacyAuditTimeline: PharmacyAuditTimelineProjection[]
  }>(`query { pharmacyAuditTimeline(take: 75) { id eventKey eventType resourceType resourceId occurredAt actorType actorName locationName } }`)

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
      ]
    : []

  return <OperationalPage title="Audit log" description="Review the audit trail of recorded events." items={items} emptyMessage="No audit events yet" error={response.success ? undefined : response.error} />
}
