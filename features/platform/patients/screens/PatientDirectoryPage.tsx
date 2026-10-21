import { keystoneClient } from '@/features/dashboard/lib/keystoneClient'
import type { PatientSafeProjection } from '@/features/pharmacy/contracts'
import { OperationalPage } from '@/features/platform/components/OperationalPage'

export async function PatientDirectoryPage() {
  const response = await keystoneClient<{ pharmacyPatientDirectory: PatientSafeProjection[] }>(`query { pharmacyPatientDirectory { id patientNumber displayName status preferredContactMethod identityVerificationStatus hasIdentityEvidence organizationNames prescriptionCount activeConsentCount latestConsentAt } }`)
  const items = response.success ? response.data.pharmacyPatientDirectory.map((patient) => ({
    id: patient.id,
    href: `/dashboard/platform/patients/${patient.id}`,
    title: patient.displayName,
    subtitle: patient.patientNumber,
    status: patient.status,
    details: [
      { label: 'Organizations', value: patient.organizationNames.join(', ') || 'None' },
      { label: 'Preferred contact', value: patient.preferredContactMethod },
      { label: 'Identity evidence', value: patient.hasIdentityEvidence ? patient.identityVerificationStatus : 'not recorded' },
      { label: 'Prescriptions', value: String(patient.prescriptionCount) },
      { label: 'Active consents', value: String(patient.activeConsentCount) },
      { label: 'Latest consent', value: patient.latestConsentAt ? new Date(patient.latestConsentAt).toLocaleDateString() : 'None' },
    ],
  })) : []
  return <OperationalPage title="Patients" description="Manage patient profiles, safety history, and consent." items={items} emptyMessage="No patients yet" error={response.success ? undefined : response.error} attentionStatuses={['inactive', 'merged', 'restricted']} primaryAction={{ href: '/dashboard/platform/patients/create', label: 'Create patient' }} />
}
