import { keystoneClient } from '@/features/dashboard/lib/keystoneClient'
import { OperationalPage, type OperationalItem } from '@/features/platform/components/OperationalPage'
import { TransitionPills } from '@/features/platform/components/TransitionPills'
import { normalizeWeeklyHours, openState } from '@/features/pharmacy/hours'
import { setLocationStatus } from '../actions'

export type LocationRow = { id: string; name: string; code: string; status: string; address?: Record<string, string> | null; phone?: string | null; timezone: string; hours?: unknown; onlineOrderingEnabled: boolean; pickupEnabled: boolean; deliveryEnabled: boolean; organization?: { id: string; name: string } | null; productsCount: number; ordersCount: number; membershipsCount: number }

export const LOCATION_FIELDS = 'id name code status address phone timezone hours onlineOrderingEnabled pickupEnabled deliveryEnabled organization { id name } productsCount ordersCount membershipsCount'

export function formatLocationAddress(address?: Record<string, string> | null) {
  return address ? [address.line1, address.line2, address.city, address.region, address.postalCode].filter(Boolean).join(', ') : ''
}

export function locationStatusOptions(location: Pick<LocationRow, 'id' | 'status'>) {
  if (location.status === 'archived') return []
  return location.status === 'active'
    ? [{ label: 'Close temporarily', action: setLocationStatus.bind(null, location.id, 'temporarily_closed'), danger: true }]
    : [{ label: 'Reopen', action: setLocationStatus.bind(null, location.id, 'active') }]
}

export async function LocationListPage() {
  const response = await keystoneClient<{ pharmacyLocations: LocationRow[] }>(`query Locations { pharmacyLocations(orderBy: [{ name: asc }], take: 100) { ${LOCATION_FIELDS} } }`)
  const items: OperationalItem[] = response.success ? response.data.pharmacyLocations.map((location) => {
    const hours = normalizeWeeklyHours(location.hours)
    return {
      id: location.id,
      href: `/dashboard/platform/locations/${location.id}`,
      title: location.name,
      subtitle: [location.code, formatLocationAddress(location.address)].filter(Boolean).join(' · '),
      status: location.status,
      details: [
        { label: 'Pharmacy now', value: hours ? (openState(hours.pharmacy, location.timezone).open ? 'Open' : 'Closed') : 'No hours set' },
        { label: 'Service', value: [location.onlineOrderingEnabled && 'Online', location.pickupEnabled && 'Pickup', location.deliveryEnabled && 'Delivery'].filter(Boolean).join(' · ') || 'In store' },
        { label: 'Phone', value: location.phone || 'Not recorded' },
        { label: 'Staff', value: String(location.membershipsCount) },
        { label: 'Products', value: String(location.productsCount) },
        { label: 'Orders', value: String(location.ordersCount) },
      ],
      actions: <TransitionPills label={`Status of ${location.name}`} options={locationStatusOptions(location)} />,
    }
  }) : []
  return <OperationalPage title="Locations" description="" items={items} emptyMessage="No locations yet" error={response.success ? undefined : response.error} attentionStatuses={['temporarily_closed']} primaryAction={{ listKey: 'pharmacy-locations', label: 'Add location' }} />
}
