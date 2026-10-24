import { platformRequest } from '@/features/platform/lib/request'
import type { PharmacyInventoryReceiptOptions, PharmacyProductOptionWorklistProjection } from '@/features/pharmacy/contracts'
import { TaskDataReadiness } from '@/features/platform/components/TaskDataReadiness'
import { TaskPage, TaskSection } from '@/features/platform/components/TaskPage'
import { InventoryReceiveForm } from '../components/InventoryReceiveForm'

const emptyProductWorklist: PharmacyProductOptionWorklistProjection = { items: [], totalCount: 0, hasMore: false, nextCursor: null }

export async function InventoryReceivePage() {
  const response = await platformRequest<{ pharmacyInventoryReceiptOptions: PharmacyInventoryReceiptOptions }>(`query { pharmacyInventoryReceiptOptions { locations { id label scopeId detail } suppliers { id label scopeId detail } } }`)
  if (!response.success) return <TaskPage parent={{ label: 'Inventory', href: '/platform/inventory' }} title="Receive lot" description={response.error} />
  const options = response.data.pharmacyInventoryReceiptOptions
  const initialLocationId = options.locations[0]?.id
  let initialProductWorklist = emptyProductWorklist
  if (initialLocationId) {
    const productsResponse = await platformRequest<{ pharmacyInventoryReceiptProductWorklist: PharmacyProductOptionWorklistProjection }>(
      `query ReceiptProducts($locationId: ID!, $first: Int, $after: String, $status: String) { pharmacyInventoryReceiptProductWorklist(locationId: $locationId, first: $first, after: $after, status: $status) { items { id label scopeId detail } totalCount hasMore nextCursor } }`,
      { locationId: initialLocationId, first: 50, after: null, status: null },
    )
    if (!productsResponse.success) return <TaskPage parent={{ label: 'Inventory', href: '/platform/inventory' }} title="Receive lot" description={productsResponse.error} />
    initialProductWorklist = productsResponse.data.pharmacyInventoryReceiptProductWorklist
  }
  const missing = !options.locations.length
  return <TaskPage parent={{ label: 'Inventory', href: '/platform/inventory' }} title="Receive lot"><TaskSection title="Setup"><TaskDataReadiness metrics={[{ label: 'Locations', value: options.locations.length }, { label: 'Products in selected location', value: initialProductWorklist.totalCount }, { label: 'Suppliers', value: options.suppliers.length }]} missingMessage={missing ? 'Add a pharmacy location before receiving inventory.' : undefined} /></TaskSection><TaskSection title="Receipt details"><InventoryReceiveForm options={options} initialProductWorklist={initialProductWorklist} /></TaskSection></TaskPage>
}
