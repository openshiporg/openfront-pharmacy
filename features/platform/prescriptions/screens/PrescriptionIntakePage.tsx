import Link from 'next/link'
import { RxButton as Button } from '@/features/platform/components/rx-ui'
import { keystoneClient } from '@/features/dashboard/lib/keystoneClient'
import type { PharmacyPrescriptionIntakeOptions } from '@/features/pharmacy/contracts'
import { TaskDataReadiness } from '@/features/platform/components/TaskDataReadiness'
import { TaskPage, TaskSection } from '@/features/platform/components/TaskPage'
import { Field } from '@/features/platform/components/rx-ui'
import { PrescriptionIntakeForm } from '../components/PrescriptionIntakeForm'

export async function PrescriptionIntakePage() {
  const response = await keystoneClient<{ pharmacyPrescriptionIntakeOptions: PharmacyPrescriptionIntakeOptions }>(`query { pharmacyPrescriptionIntakeOptions { organizations { id label scopeId detail } locations { id label scopeId detail } patients { id label scopeId detail } prescribers { id label scopeId detail } products { id label scopeId detail } } }`)
  if (!response.success) return <TaskPage parent={{ label: 'Prescriptions', href: '/platform/prescriptions' }} title="New prescription" state="Unavailable" tone="warn"><TaskSection title="Access"><dl className="grid gap-3 sm:grid-cols-2"><Field label="Permission">Manage prescriptions</Field><Field label="Credential">Pharmacist review recorded</Field></dl><Button asChild variant="outline" className="mt-4"><Link href="/dashboard/platform/credentials">Open credential review</Link></Button></TaskSection></TaskPage>
  const options = response.data.pharmacyPrescriptionIntakeOptions
  const missing = !options.organizations.length || !options.locations.length || !options.patients.length || !options.prescribers.length || !options.products.length
  return <TaskPage parent={{ label: 'Prescriptions', href: '/platform/prescriptions' }} title="New prescription"><TaskSection title="Setup"><TaskDataReadiness metrics={[{ label: 'Locations', value: options.locations.length }, { label: 'Patients', value: options.patients.length }, { label: 'Prescribers', value: options.prescribers.length }, { label: 'Eligible products', value: options.products.length }]} missingMessage={missing ? 'Add a location, patient, prescriber, and non-controlled product before recording a prescription.' : undefined} /></TaskSection><TaskSection title="Fill policy" action={<Link href="/dashboard/platform/credentials" className="text-[13px] font-medium underline underline-offset-4">Credential review</Link>}><p className="text-sm font-medium">Required before intake</p></TaskSection><TaskSection title="Intake details"><PrescriptionIntakeForm options={options} /></TaskSection></TaskPage>
}
