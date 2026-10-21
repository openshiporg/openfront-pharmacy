import { keystoneClient } from '@/features/dashboard/lib/keystoneClient'
import type { PharmacyRecallOpenOptions } from '@/features/pharmacy/contracts'
import { TaskDataReadiness } from '@/features/platform/components/TaskDataReadiness'
import { TaskPage, TaskSection } from '@/features/platform/components/TaskPage'
import { RecallOpenForm } from '../components/RecallOpenForm'

export async function RecallOpenPage() {
  const response = await keystoneClient<{ pharmacyRecallOpenOptions: PharmacyRecallOpenOptions }>(`query { pharmacyRecallOpenOptions { organizations { id label scopeId detail } organizationWideOrganizationIds locations { id label scopeId detail } lots { id label organizationId locationId detail } } }`)
  if (!response.success) return <TaskPage parent={{ label: 'Recalls', href: '/platform/recalls' }} title="Open recall" description={response.error} />
  const options = response.data.pharmacyRecallOpenOptions
  const missing = !options.organizations.length || !options.locations.length || !options.lots.length
  return <TaskPage parent={{ label: 'Recalls', href: '/platform/recalls' }} title="Open recall" description="Quarantine affected stock and create patient outreach tasks."><TaskSection title="Setup"><TaskDataReadiness metrics={[{ label: 'Organizations', value: options.organizations.length }, { label: 'Locations', value: options.locations.length }, { label: 'Eligible lots', value: options.lots.length }]} missingMessage={missing ? 'Receive at least one inventory lot before opening a recall.' : undefined} /></TaskSection><TaskSection title="Source and affected lots"><RecallOpenForm {...options} /></TaskSection></TaskPage>
}
