import { platformRequest } from '@/features/platform/lib/request'
import { normalizeWeeklyHours } from '@/features/pharmacy/hours'
import { TaskPage, TaskSection } from '@/features/platform/components/TaskPage'
import { TransitionPills } from '@/features/platform/components/TransitionPills'
import { Field, Mono, TitleLine, humanize, statusTone } from '@/features/platform/components/rx-ui'
import { LocationHoursEditor } from '../../store-settings/components/LocationHoursEditor'
import { setLocationSwitch } from '../actions'
import { LocationContactForm } from '../components/LocationContactForm'
import { LOCATION_FIELDS, formatLocationAddress, locationStatusOptions, type LocationRow } from './LocationListPage'

const SWITCHES = [['onlineOrderingEnabled', 'Online ordering'], ['pickupEnabled', 'Pickup'], ['deliveryEnabled', 'Delivery']] as const

export async function LocationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const response = await platformRequest<{ pharmacyLocation: LocationRow | null }>(`query Location($id: ID!) { pharmacyLocation(where: { id: $id }) { ${LOCATION_FIELDS} } }`, { id })
  const parent = { label: 'Locations', href: '/platform/locations' }
  if (!response.success || !response.data.pharmacyLocation) return <TaskPage parent={parent} title="Location unavailable" description={response.success ? 'Not found' : response.error} />
  const location = response.data.pharmacyLocation

  return <TaskPage parent={parent} meta={`Location ${location.code}`} title={location.name} state={humanize(location.status)} tone={statusTone(location.status === 'temporarily_closed' ? 'on_hold' : location.status)} description={formatLocationAddress(location.address) || location.organization?.name}>
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl bg-muted/40 px-4 py-4 ring-1 ring-inset ring-border/60 sm:grid-cols-4 sm:px-5">
      <Field label="Phone">{location.phone ? <Mono>{location.phone}</Mono> : 'Not recorded'}</Field>
      <Field label="Staff"><Mono>{location.membershipsCount}</Mono></Field>
      <Field label="Products"><Mono>{location.productsCount}</Mono></Field>
      <Field label="Orders"><Mono>{location.ordersCount}</Mono></Field>
    </dl>
    <TaskSection title="Status and service">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="grid gap-2"><TitleLine as="h3" titleClassName="text-sm" title="Location" tone={location.status === 'active' ? 'ok' : 'warn'} state={humanize(location.status)} /><TransitionPills label="Location status" options={locationStatusOptions(location)} /></div>
        {SWITCHES.map(([field, label]) => <div key={field} className="grid gap-2"><TitleLine as="h3" titleClassName="text-sm" title={label} tone={location[field] ? 'ok' : 'muted'} state={location[field] ? 'On' : 'Off'} /><TransitionPills label={label} options={[{ label: location[field] ? 'Turn off' : 'Turn on', action: setLocationSwitch.bind(null, location.id, field, !location[field]) }]} /></div>)}
      </div>
    </TaskSection>
    <TaskSection title="Contact and address"><LocationContactForm id={location.id} name={location.name} phone={location.phone} address={location.address} /></TaskSection>
    <LocationHoursEditor location={{ id: location.id, name: 'Hours', timezone: location.timezone || 'America/New_York', hours: normalizeWeeklyHours(location.hours) }} />
  </TaskPage>
}
