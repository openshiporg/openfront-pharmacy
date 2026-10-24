import { keystoneClient } from '@/features/dashboard/lib/keystoneClient'
import { OperationalPage, type OperationalItem } from '@/features/platform/components/OperationalPage'
import { TransitionPills } from '@/features/platform/components/TransitionPills'
import { setSupplierStatus } from '../actions'

type Supplier = { id: string; name: string; accountReference?: string | null; status: string; organization?: { name: string } | null; integrationProvider?: { name: string } | null; inventoryLotsCount: number }

export function supplierActions(supplier: Pick<Supplier, 'id' | 'status'>) {
  return supplier.status === 'active'
    ? [{ label: 'Suspend', action: setSupplierStatus.bind(null, supplier.id, 'suspended'), danger: true }]
    : [{ label: 'Activate', action: setSupplierStatus.bind(null, supplier.id, 'active') }]
}

export async function SupplierListPage() {
  const response = await keystoneClient<{ suppliers: Supplier[] }>('query Suppliers { suppliers(orderBy: [{ name: asc }], take: 200) { id name accountReference status organization { name } integrationProvider { name } inventoryLotsCount } }')
  const items: OperationalItem[] = response.success ? response.data.suppliers.map((supplier) => ({
    id: supplier.id,
    href: `/dashboard/platform/suppliers/${supplier.id}`,
    title: supplier.name,
    subtitle: supplier.accountReference ? `Account ${supplier.accountReference}` : supplier.organization?.name,
    status: supplier.status,
    details: [
      { label: 'Lots received', value: String(supplier.inventoryLotsCount) },
      { label: 'Account', value: supplier.accountReference || 'Not recorded' },
      { label: 'Integration', value: supplier.integrationProvider?.name || 'None' },
    ],
    actions: <TransitionPills label={`Status of ${supplier.name}`} options={supplierActions(supplier)} />,
  })) : []
  return <OperationalPage title="Suppliers" description="" items={items} emptyMessage="No suppliers yet" error={response.success ? undefined : response.error} attentionStatuses={['pending_validation', 'suspended']} primaryAction={{ listKey: 'suppliers', label: 'Add supplier' }} />
}
