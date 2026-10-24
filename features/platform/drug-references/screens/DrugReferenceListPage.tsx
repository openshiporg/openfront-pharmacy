import { keystoneClient } from '@/features/dashboard/lib/keystoneClient'
import { OperationalPage, type OperationalItem } from '@/features/platform/components/OperationalPage'
import { humanize } from '@/features/platform/components/rx-ui'
import { shortDate } from '../../lib/mutate'

type DrugReference = { id: string; ndc11: string; proprietaryName: string; genericName?: string | null; strength?: string | null; dosageForm?: string | null; labelerName?: string | null; controlledSchedule: string; marketingStatus: string; reviewedAt?: string | null; productsCount: number; reviewsCount: number }

export async function DrugReferenceListPage() {
  const response = await keystoneClient<{ drugReferences: DrugReference[] }>('query DrugReferences { drugReferences(orderBy: [{ proprietaryName: asc }], take: 500) { id ndc11 proprietaryName genericName strength dosageForm labelerName controlledSchedule marketingStatus reviewedAt productsCount reviewsCount } }')
  const items: OperationalItem[] = response.success ? response.data.drugReferences.map((drug) => ({
    id: drug.id,
    href: `/dashboard/platform/drug-references/${drug.id}`,
    title: `${drug.proprietaryName}${drug.strength ? ` ${drug.strength}` : ''}`,
    subtitle: `NDC ${drug.ndc11}${drug.genericName ? ` · ${drug.genericName}` : ''}`,
    status: drug.reviewsCount ? (drug.marketingStatus === 'active' ? 'active' : drug.marketingStatus) : 'unverified',
    details: [
      { label: 'Schedule', value: humanize(drug.controlledSchedule) },
      { label: 'Products', value: String(drug.productsCount) },
      { label: 'Reviewed', value: drug.reviewedAt ? shortDate(drug.reviewedAt) : drug.reviewsCount ? 'Yes' : 'Not reviewed' },
      { label: 'Dosage form', value: drug.dosageForm || 'Not recorded' },
      { label: 'Labeler', value: drug.labelerName || 'Not recorded' },
    ],
  })) : []
  return <OperationalPage title="Drug references" description="" items={items} emptyMessage="No drug references yet" error={response.success ? undefined : response.error} attentionStatuses={['unverified', 'inactive']} primaryAction={{ listKey: 'drug-references', label: 'Add drug reference' }} />
}
