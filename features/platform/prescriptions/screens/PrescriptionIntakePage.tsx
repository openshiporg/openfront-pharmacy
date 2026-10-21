import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { keystoneClient } from '@/features/dashboard/lib/keystoneClient'
import type { PharmacyPrescriptionIntakeOptions } from '@/features/pharmacy/contracts'
import { TaskDataReadiness } from '@/features/platform/components/TaskDataReadiness'
import { TaskPage, TaskSection } from '@/features/platform/components/TaskPage'
import { PrescriptionIntakeForm } from '../components/PrescriptionIntakeForm'

export async function PrescriptionIntakePage() {
  const response = await keystoneClient<{ pharmacyPrescriptionIntakeOptions: PharmacyPrescriptionIntakeOptions }>(`query { pharmacyPrescriptionIntakeOptions { organizations { id label scopeId detail } locations { id label scopeId detail } patients { id label scopeId detail } prescribers { id label scopeId detail } products { id label scopeId detail } } }`)
  if (!response.success) return <TaskPage parent={{ label: 'Prescriptions', href: '/platform/prescriptions' }} title="New prescription" description="Prescription intake is unavailable."><TaskSection title="Access"><p className="text-sm text-muted-foreground">Requires the Manage prescriptions permission and a recorded pharmacist credential review.</p><Button asChild variant="outline" className="mt-4"><Link href="/dashboard/platform/credentials">Open credential review</Link></Button></TaskSection></TaskPage>
  const options = response.data.pharmacyPrescriptionIntakeOptions
  const missing = !options.organizations.length || !options.locations.length || !options.patients.length || !options.prescribers.length || !options.products.length
  return <TaskPage parent={{ label: 'Prescriptions', href: '/platform/prescriptions' }} title="New prescription"><TaskSection title="Setup"><TaskDataReadiness metrics={[{ label: 'Locations', value: options.locations.length }, { label: 'Patients', value: options.patients.length }, { label: 'Prescribers', value: options.prescribers.length }, { label: 'Eligible products', value: options.products.length }]} missingMessage={missing ? 'Add a location, patient, prescriber, and non-controlled product before recording a prescription.' : undefined} /></TaskSection><TaskSection title="Fill policy"><p className="text-sm">A reviewed fill policy is required. <Link href="/dashboard/platform/credentials" className="underline">Set fill policy</Link></p></TaskSection><TaskSection title="Intake details"><PrescriptionIntakeForm options={options} /></TaskSection></TaskPage>
}
