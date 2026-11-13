import { platformRequest } from '@/features/platform/lib/request'
import type { PharmacyAuditTimelineProjection } from '@/features/pharmacy/contracts'
import { OperationalPage, type OperationalItem } from '@/features/platform/components/OperationalPage'
import { formatDateTime } from '@/features/platform/lib/dates'
import { getStoreTimeZone } from '@/features/platform/lib/store-time-zone'

/** "payment.refunded" reads "Payment refunded"; "fulfillment.handed_off" reads "Fulfillment handed off". */
function eventLabel(eventType: string) {
  const words = eventType.replaceAll('.', ' ').replaceAll('_', ' ').replace(/\s+/g, ' ').trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** "PatientProfile" reads "Patient profile". */
function resourceLabel(resourceType: string) {
  const words = resourceType.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

export async function AuditTimelinePage() {
  const timeZone = await getStoreTimeZone()
  const response = await platformRequest<{
    pharmacyAuditTimeline: PharmacyAuditTimelineProjection[]
  }>(`query { pharmacyAuditTimeline(take: 75) { id eventKey eventType resourceType resourceId occurredAt actorType actorName locationName } }`)

  const items: OperationalItem[] = response.success
    ? [
        ...response.data.pharmacyAuditTimeline.map((event) => ({
          id: `audit:${event.id}`,
          title: eventLabel(event.eventType),
          subtitle: `${resourceLabel(event.resourceType)} · ${event.actorName || 'System'}`,
          status: 'recorded',
          details: [
            { label: 'Occurred', value: formatDateTime(event.occurredAt, timeZone) },
            { label: 'Actor', value: event.actorName || event.actorType },
            { label: 'Location', value: event.locationName || 'Organization-wide' },
            { label: 'Record', value: event.resourceId },
          ],
        })),
      ]
    : []

  return <OperationalPage title="Audit log" description="Review the audit trail of recorded events." items={items} emptyMessage="No audit events yet" error={response.success ? undefined : response.error} />
}
