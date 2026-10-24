import Link from 'next/link'

import { keystoneClient } from '@/features/dashboard/lib/keystoneClient'
import { RecordDrawerButton } from '@/features/platform/components/RecordDrawerButton'
import { TaskPage, TaskSection } from '@/features/platform/components/TaskPage'
import { TransitionPills } from '@/features/platform/components/TransitionPills'
import { Callout, Field, ListBand, Mono, TitleLine, humanize, statusTone } from '@/features/platform/components/rx-ui'
import { money, shortDate } from '../../lib/mutate'
import { setProductChannel, setProductStatus } from '../actions'

type Product = {
  id: string
  title: string
  handle: string
  sku: string
  description?: string | null
  status: string
  category: string
  prescriptionRequirement: string
  priceAmount: number
  currencyCode: string
  taxable: boolean
  onlineAvailable: boolean
  posAvailable: boolean
  coldChainRequired: boolean
  imageUrl?: string | null
  location?: { id: string; name: string } | null
  drugReference?: { id: string; ndc11: string; proprietaryName: string; strength?: string | null; marketingStatus: string; controlledSchedule: string } | null
  inventoryLots?: Array<{ id: string; lotNumber: string; status: string; expirationDate: string; quantityAvailable: number; quantityQuarantined: number; storageBin?: string | null }> | null
  orderLineItemsCount?: number
  prescriptionItemsCount?: number
}

export async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const response = await keystoneClient<{ product: Product | null }>(
    `query Product($id: ID!) { product(where: { id: $id }) { id title handle sku description status category prescriptionRequirement priceAmount currencyCode taxable onlineAvailable posAvailable coldChainRequired imageUrl location { id name } drugReference { id ndc11 proprietaryName strength marketingStatus controlledSchedule } inventoryLots(orderBy: [{ expirationDate: asc }]) { id lotNumber status expirationDate quantityAvailable quantityQuarantined storageBin } orderLineItemsCount prescriptionItemsCount } }`,
    { id },
  )
  const parent = { label: 'Products', href: '/platform/products' }
  if (!response.success || !response.data.product) return <TaskPage parent={parent} title="Product unavailable" description={response.success ? 'Not found' : response.error} />
  const product = response.data.product
  const lots = product.inventoryLots || []
  const onHand = lots.filter((lot) => lot.status === 'available').reduce((sum, lot) => sum + lot.quantityAvailable, 0)
  const rx = product.prescriptionRequirement !== 'none'

  const statusOptions = [
    ...(product.status !== 'published' ? [{ label: 'Publish', action: setProductStatus.bind(null, product.id, 'published') }] : []),
    ...(product.status === 'published' ? [{ label: 'Unpublish', action: setProductStatus.bind(null, product.id, 'draft') }] : []),
    ...(product.status !== 'archived' ? [{ label: 'Archive', action: setProductStatus.bind(null, product.id, 'archived'), danger: true }] : []),
  ]

  return <TaskPage parent={parent} meta={`${product.sku} · ${humanize(product.category)}`} title={product.title} state={humanize(product.status)} tone={statusTone(product.status === 'published' ? 'active' : product.status === 'archived' ? 'inactive' : 'draft')} description={product.location?.name} actions={<RecordDrawerButton listPath="products" itemId={product.id} label="Edit" />}>
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl bg-muted/40 px-4 py-4 ring-1 ring-inset ring-border/60 sm:grid-cols-4 sm:px-5">
      <Field label="Price"><Mono>{money(product.priceAmount, product.currencyCode)}</Mono>{product.taxable ? '' : ' · tax exempt'}</Field>
      <Field label="On hand"><Mono>{onHand}</Mono></Field>
      <Field label="Prescription">{rx ? humanize(product.prescriptionRequirement) : 'Not required'}</Field>
      <Field label="Handle"><Mono>{product.handle}</Mono></Field>
    </dl>
    {rx && !product.drugReference && <Callout tone="warn" title="No drug reference">Prescription products need an NDC drug reference.</Callout>}
    {product.status === 'published' && product.onlineAvailable && rx && <Callout tone="muted">Prescription products are not sold through online checkout.</Callout>}

    <TaskSection title="Status and channels">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-2"><TitleLine as="h3" titleClassName="text-sm" title="Status" tone={product.status === 'published' ? 'ok' : product.status === 'archived' ? 'muted' : 'warn'} state={humanize(product.status)} /><TransitionPills label="Product status" options={statusOptions} /></div>
        <div className="grid gap-2"><TitleLine as="h3" titleClassName="text-sm" title="Online store" tone={product.onlineAvailable ? 'ok' : 'muted'} state={product.onlineAvailable ? 'On' : 'Off'} /><TransitionPills label="Online store" options={[{ label: product.onlineAvailable ? 'Turn off' : 'Turn on', action: setProductChannel.bind(null, product.id, 'onlineAvailable', !product.onlineAvailable) }]} /></div>
        <div className="grid gap-2"><TitleLine as="h3" titleClassName="text-sm" title="Point of sale" tone={product.posAvailable ? 'ok' : 'muted'} state={product.posAvailable ? 'On' : 'Off'} /><TransitionPills label="Point of sale" options={[{ label: product.posAvailable ? 'Turn off' : 'Turn on', action: setProductChannel.bind(null, product.id, 'posAvailable', !product.posAvailable) }]} /></div>
      </div>
    </TaskSection>

    <TaskSection title="Drug reference">
      {product.drugReference
        ? <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div><TitleLine as="h3" titleClassName="text-sm" title={<Link href={`/dashboard/platform/drug-references/${product.drugReference.id}`} className="hover:underline hover:underline-offset-4">{product.drugReference.proprietaryName}{product.drugReference.strength ? ` ${product.drugReference.strength}` : ''}</Link>} tone={statusTone(product.drugReference.marketingStatus === 'active' ? 'active' : 'pending_review')} state={humanize(product.drugReference.marketingStatus)} /><p className="mt-0.5 font-mono text-[11px] text-muted-foreground">NDC {product.drugReference.ndc11} · {humanize(product.drugReference.controlledSchedule)}</p></div>
        </div>
        : <p className="text-sm text-muted-foreground">None linked.</p>}
    </TaskSection>

    <TaskSection title="Lots" count={lots.length} action={<Link href="/dashboard/platform/inventory/receive" className="text-[13px] font-medium underline underline-offset-4">Receive lot</Link>}>
      {lots.length ? <ListBand>{lots.map((lot) => <Link key={lot.id} href={`/dashboard/platform/inventory/${lot.id}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 bg-background px-3.5 py-2.5 text-sm hover:bg-muted/40">
        <span className="min-w-0"><TitleLine as="h3" titleClassName="text-sm font-mono" title={lot.lotNumber} tone={statusTone(lot.status)} state={humanize(lot.status)} /><span className="block font-mono text-[11px] text-muted-foreground">Expires {shortDate(lot.expirationDate)}{lot.storageBin ? ` · Bin ${lot.storageBin}` : ''}</span></span>
        <Mono className="text-right">{lot.quantityAvailable}{lot.quantityQuarantined ? <span className="block text-[11px] text-amber-700 dark:text-amber-300">{lot.quantityQuarantined} held</span> : null}</Mono>
      </Link>)}</ListBand> : <p className="text-sm text-muted-foreground">No lots received.</p>}
    </TaskSection>

    <TaskSection title="Usage">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3"><Field label="Order lines"><Mono>{product.orderLineItemsCount ?? 0}</Mono></Field><Field label="Prescription items"><Mono>{product.prescriptionItemsCount ?? 0}</Mono></Field></dl>
      {product.description && <p className="mt-4 whitespace-pre-line text-sm text-muted-foreground">{product.description}</p>}
    </TaskSection>
  </TaskPage>
}
