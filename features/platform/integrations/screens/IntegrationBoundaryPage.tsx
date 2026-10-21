import { keystoneClient } from '@/features/dashboard/lib/keystoneClient'
import type { PharmacyIntegrationStatusProjection } from '@/features/pharmacy/contracts'
import { OperationalPage } from '@/features/platform/components/OperationalPage'

export async function IntegrationBoundaryPage() {
  const response = await keystoneClient<{ pharmacyIntegrationStatus: PharmacyIntegrationStatusProjection[] }>(`query { pharmacyIntegrationStatus { id name code providerType status externalValidationComplete hasValidationReference organizationName } }`)
  const items = response.success ? response.data.pharmacyIntegrationStatus.map((provider) => ({
    id: provider.id,
    title: provider.name,
    subtitle: `${provider.providerType} · ${provider.code}`,
    status: provider.status,
    details: [
      { label: 'Organization', value: provider.organizationName },
      { label: 'External validation', value: provider.externalValidationComplete ? 'Recorded' : 'Required' },
      { label: 'Reference on file', value: provider.hasValidationReference ? 'Yes' : 'No' },
    ],
  })) : []
  return <OperationalPage title="Integration providers" description="Manage integration providers." items={items} emptyMessage="No integration providers yet" error={response.success ? undefined : response.error} attentionStatuses={['inactive', 'disabled', 'error', 'validation_required']} />
}
