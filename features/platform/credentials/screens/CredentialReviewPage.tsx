import Link from 'next/link'

import { basePath } from '@/features/dashboard/lib/config'
import { platformRequest } from '@/features/platform/lib/request'
import { getStoreTimeZone } from '@/features/platform/lib/store-time-zone'
import type { PharmacyTaskOption } from '@/features/pharmacy/contracts'
import { Dot, ListBand } from '@/features/platform/components/rx-ui'
import { TaskDataReadiness } from '@/features/platform/components/TaskDataReadiness'
import { TaskPage, TaskSection } from '@/features/platform/components/TaskPage'
import { FillPolicySetup } from '../../prescriptions/components/FillPolicySetup'
import { CredentialReviewForms } from '../components/CredentialReviewForms'

type DispensingSetup = { pharmacistReviewed: boolean; prescriberReady: boolean; prescriberHasNpi: boolean; drugReferenceReviewed: boolean; cashPolicyRecorded: boolean; prescriptionProductStocked: boolean }

function SetupChecklist({ setup, hasDrugReferences }: { setup: DispensingSetup; hasDrugReferences: boolean }) {
  const steps: Array<{ label: string; done: boolean; href?: string; action?: string }> = [
    { label: 'Pharmacist credential review', done: setup.pharmacistReviewed, href: '#reviews', action: 'Record below' },
    { label: 'Prescriber with an NPI', done: setup.prescriberHasNpi, href: `${basePath}/platform/prescribers`, action: 'Add NPI' },
    { label: 'Prescriber credential review', done: setup.prescriberReady, href: '#reviews', action: 'Record below' },
    { label: 'Drug reference review', done: setup.drugReferenceReviewed, href: hasDrugReferences ? '#reviews' : `${basePath}/platform/drug-references`, action: hasDrugReferences ? 'Record below' : 'Add drug reference' },
    { label: 'Cash and sales-tax policy', done: setup.cashPolicyRecorded, href: '#reviews', action: 'Record below' },
    { label: 'Prescription item in stock', done: setup.prescriptionProductStocked, href: `${basePath}/platform/inventory/receive`, action: 'Receive stock' },
  ]
  const left = steps.filter((step) => !step.done).length
  return <div className="space-y-3">
    <p className="flex items-baseline gap-2 text-sm font-medium"><Dot tone={left ? 'warn' : 'ok'} />{left ? `${left} of ${steps.length} left before the first prescription` : 'Ready to fill prescriptions'}</p>
    <ListBand>{steps.map((step) => <div key={step.label} className="flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 text-sm">
      <span className="flex items-baseline gap-2"><Dot tone={step.done ? 'ok' : 'warn'} />{step.label}</span>
      {step.done ? <span className="text-muted-foreground">Done</span> : step.href && <Link href={step.href} className="font-medium underline underline-offset-4">{step.action}</Link>}
    </div>)}</ListBand>
  </div>
}

export async function CredentialReviewPage() {
  const response = await platformRequest<{ pharmacyCredentialReviewOptions: { organizationWideOrganizationIds: string[]; setup: DispensingSetup; organizations: PharmacyTaskOption[]; memberships: PharmacyTaskOption[]; prescribers: PharmacyTaskOption[]; drugReferences: PharmacyTaskOption[] } }>(`query { pharmacyCredentialReviewOptions { organizationWideOrganizationIds setup { pharmacistReviewed prescriberReady prescriberHasNpi drugReferenceReviewed cashPolicyRecorded prescriptionProductStocked } organizations { id label scopeId detail } memberships { id label scopeId detail } prescribers { id label scopeId detail } drugReferences { id label scopeId detail } } }`)
  if (!response.success) return <TaskPage title="Credential review" description={response.error} />
  const options = response.data.pharmacyCredentialReviewOptions
  const missing = !options.organizations.length || !options.memberships.length || !options.prescribers.length || !options.drugReferences.length
  return <TaskPage title="Credential review" description="Record pharmacist, prescriber, and drug reference reviews.">
    <TaskSection title="Setup"><TaskDataReadiness metrics={[{ label: 'Organizations', value: options.organizations.length }, { label: 'Staff memberships', value: options.memberships.length }, { label: 'Prescribers', value: options.prescribers.length }, { label: 'Drug references', value: options.drugReferences.length }]} missingMessage={missing ? 'Missing a pharmacy, staff membership, prescriber or drug reference.' : undefined} /><div className="mt-4"><SetupChecklist setup={options.setup} hasDrugReferences={options.drugReferences.length > 0} /></div></TaskSection>
    <TaskSection title="Fill policy"><FillPolicySetup organizations={options.organizations.filter(organization => options.organizationWideOrganizationIds.includes(organization.id))} /></TaskSection>
    <div id="reviews" className="scroll-mt-20"><TaskSection title="Reviews"><CredentialReviewForms timeZone={await getStoreTimeZone()} organizations={options.organizations} memberships={options.memberships} prescribers={options.prescribers} drugReferences={options.drugReferences} /></TaskSection></div>
  </TaskPage>
}
