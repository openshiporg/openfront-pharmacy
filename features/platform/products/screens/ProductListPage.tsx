import { platformRequest } from '@/features/platform/lib/request'
import { OperationalPage, type OperationalItem } from '@/features/platform/components/OperationalPage'
import { TransitionPills } from '@/features/platform/components/TransitionPills'
import { humanize } from '@/features/platform/components/rx-ui'
import { money } from '../../lib/mutate'
import { setProductStatus } from '../actions'

export type ProductRow = {
  id: string
  title: string
  sku: string
  status: string
  category: string
  prescriptionRequirement: string
  priceAmount: number
  currencyCode: string
  onlineAvailable: boolean
  posAvailable: boolean
  coldChainRequired: boolean
  location?: { name: string } | null
  drugReference?: { id: string; ndc11: string } | null
  inventoryLots?: Array<{ quantityAvailable: number; quantityQuarantined: number; status: string }> | null
}

export const PRODUCT_FIELDS = 'id title sku status category prescriptionRequirement priceAmount currencyCode onlineAvailable posAvailable coldChainRequired location { name } drugReference { id ndc11 } inventoryLots { quantityAvailable quantityQuarantined status }'

export function onHand(product: Pick<ProductRow, 'inventoryLots'>) {
  return (product.inventoryLots || []).filter((lot) => lot.status === 'available').reduce((sum, lot) => sum + lot.quantityAvailable, 0)
}

function statusActions(product: ProductRow) {
  const options = []
  if (product.status !== 'published') options.push({ label: 'Publish', action: setProductStatus.bind(null, product.id, 'published') })
  if (product.status === 'published') options.push({ label: 'Unpublish', action: setProductStatus.bind(null, product.id, 'draft') })
  if (product.status !== 'archived') options.push({ label: 'Archive', action: setProductStatus.bind(null, product.id, 'archived'), danger: true })
  return options
}

export async function ProductListPage() {
  const response = await platformRequest<{ products: ProductRow[] }>(`query Products { products(orderBy: [{ title: asc }], take: 500) { ${PRODUCT_FIELDS} } }`)
  const items: OperationalItem[] = response.success ? response.data.products.map((product) => {
    const stock = onHand(product)
    return {
      id: product.id,
      href: `/dashboard/platform/products/${product.id}`,
      title: product.title,
      subtitle: `${product.sku} · ${humanize(product.category)}${product.location ? ` · ${product.location.name}` : ''}`,
      status: product.status,
      details: [
        { label: 'Price', value: money(product.priceAmount, product.currencyCode) },
        { label: 'On hand', value: String(stock) },
        { label: 'Prescription', value: product.prescriptionRequirement === 'none' ? 'Not required' : humanize(product.prescriptionRequirement) },
        { label: 'Channels', value: [product.onlineAvailable && 'Online', product.posAvailable && 'POS'].filter(Boolean).join(' · ') || 'None' },
        { label: 'NDC', value: product.drugReference?.ndc11 || 'None' },
        { label: 'Cold chain', value: product.coldChainRequired ? 'Required' : 'No' },
      ],
      actions: <TransitionPills label={`Status of ${product.title}`} options={statusActions(product)} />,
    }
  }) : []
  return <OperationalPage title="Products" description="" items={items} emptyMessage="No products yet" error={response.success ? undefined : response.error} attentionStatuses={['draft']} primaryAction={{ listKey: 'products', label: 'Add product' }} />
}
