import { keystoneClient } from '@/features/dashboard/lib/keystoneClient'
import type { PharmacyTaskOption } from '@/features/pharmacy/contracts'
import { TaskDataReadiness } from '@/features/platform/components/TaskDataReadiness'
import { TaskPage, TaskSection } from '@/features/platform/components/TaskPage'
import { PatientCreateForm } from '../components/PatientCreateForm'

export async function PatientCreatePage() {
  const response = await keystoneClient<{ pharmacyPatientRecordOptions: { organizations: PharmacyTaskOption[] } }>(`query { pharmacyPatientRecordOptions { organizations { id label scopeId detail } } }`)
  if (!response.success) return <TaskPage parent={{ label: 'Patients', href: '/platform/patients' }} title="Create patient" description={response.error} />
  const organizations = response.data.pharmacyPatientRecordOptions.organizations
  return <TaskPage parent={{ label: 'Patients', href: '/platform/patients' }} title="Create patient"><TaskSection title="Setup"><TaskDataReadiness metrics={[{ label: 'Organizations', value: organizations.length }]} missingMessage={!organizations.length ? 'No pharmacy is available. Complete onboarding first.' : undefined} /></TaskSection><TaskSection title="Patient identity and contact"><PatientCreateForm organizations={organizations} /></TaskSection></TaskPage>
}
