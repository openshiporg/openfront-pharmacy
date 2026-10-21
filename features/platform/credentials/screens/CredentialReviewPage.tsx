import { keystoneClient } from '@/features/dashboard/lib/keystoneClient'
import type { PharmacyTaskOption } from '@/features/pharmacy/contracts'
import { TaskDataReadiness } from '@/features/platform/components/TaskDataReadiness'
import { TaskPage, TaskSection } from '@/features/platform/components/TaskPage'
import { FillPolicySetup } from '../../prescriptions/components/FillPolicySetup'
import { CredentialReviewForms } from '../components/CredentialReviewForms'

export async function CredentialReviewPage() {
  const response = await keystoneClient<{ pharmacyCredentialReviewOptions: { organizationWideOrganizationIds: string[]; organizations: PharmacyTaskOption[]; memberships: PharmacyTaskOption[]; prescribers: PharmacyTaskOption[]; drugReferences: PharmacyTaskOption[] } }>(`query { pharmacyCredentialReviewOptions { organizationWideOrganizationIds organizations { id label scopeId detail } memberships { id label scopeId detail } prescribers { id label scopeId detail } drugReferences { id label scopeId detail } } }`)
  if (!response.success) return <TaskPage title="Credential review" description={response.error} />
  const options = response.data.pharmacyCredentialReviewOptions
  const missing = !options.organizations.length || !options.memberships.length || !options.prescribers.length || !options.drugReferences.length
  return <TaskPage title="Credential review" description="Record pharmacist, prescriber, and drug reference reviews."><TaskSection title="Setup"><TaskDataReadiness metrics={[{ label: 'Organizations', value: options.organizations.length }, { label: 'Staff memberships', value: options.memberships.length }, { label: 'Prescribers', value: options.prescribers.length }, { label: 'Drug references', value: options.drugReferences.length }]} missingMessage={missing ? 'Add a pharmacy, staff membership, prescriber, and drug reference before recording reviews.' : undefined} /></TaskSection><TaskSection title="Fill policy"><FillPolicySetup organizations={options.organizations.filter(organization => options.organizationWideOrganizationIds.includes(organization.id))} /></TaskSection><TaskSection title="Reviews"><CredentialReviewForms organizations={options.organizations} memberships={options.memberships} prescribers={options.prescribers} drugReferences={options.drugReferences} /></TaskSection></TaskPage>
}
