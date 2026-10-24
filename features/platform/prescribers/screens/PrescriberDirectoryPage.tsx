import { platformRequest } from '@/features/platform/lib/request'
import { OperationalPage } from '@/features/platform/components/OperationalPage'

type Prescriber = { id: string; name: string; npi?: string | null; phone?: string | null; fax?: string | null; verificationStatus: string; externalValidationComplete: boolean; organizationName: string; prescriptionCount: number }

export async function PrescriberDirectoryPage() {
  const response = await platformRequest<{ pharmacyPrescriberDirectory: Prescriber[] }>(`query { pharmacyPrescriberDirectory { id name npi phone fax verificationStatus externalValidationComplete organizationName prescriptionCount } }`)
  const items = response.success ? response.data.pharmacyPrescriberDirectory.map((entry) => ({
    id: entry.id,
    title: entry.name,
    href: `/dashboard/platform/prescribers/${entry.id}`,
    subtitle: entry.organizationName,
    status: entry.verificationStatus,
    details: [
      { label: 'NPI', value: entry.npi || 'Not recorded' },
      { label: 'Phone', value: entry.phone || 'Not recorded' },
      { label: 'Fax', value: entry.fax || 'Not recorded' },
      { label: 'Linked prescriptions', value: String(entry.prescriptionCount) },
      { label: 'External validation', value: entry.externalValidationComplete ? 'Recorded' : 'Not recorded' },
    ],
  })) : []
  return <OperationalPage title="Prescribers" description="Manage prescribers, contact details, and review status." items={items} emptyMessage="No prescribers yet" error={response.success ? undefined : response.error} attentionStatuses={['not_reviewed', 'expired', 'rejected', 'validation_required']} primaryAction={{ listKey: 'prescribers', label: 'Add prescriber' }} />
}
