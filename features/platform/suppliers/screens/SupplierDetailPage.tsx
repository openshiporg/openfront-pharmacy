import Link from 'next/link'

import { platformRequest } from '@/features/platform/lib/request'
import { RecordDrawerButton } from '@/features/platform/components/RecordDrawerButton'
import { TaskPage, TaskSection } from '@/features/platform/components/TaskPage'
import { TransitionPills } from '@/features/platform/components/TransitionPills'
import { Field, ListBand, Mono, TitleLine, humanize, statusTone } from '@/features/platform/components/rx-ui'
import { shortDate } from '../../lib/mutate'
import { supplierActions } from './SupplierListPage'

type Supplier = {
  id: string; name: string; accountReference?: string | null; status: string; organization?: { name: string } | null; integrationProvider?: { name: string; status: string } | null
  inventoryLots: Array<{ id: string; lotNumber: string; status: string; receivedAt: string; expirationDate: string; quantityReceived: number; quantityAvailable: number; product?: { title: string } | null; location?: { name: string } | null }>
  inventoryLotsCount: number
}

export async function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const response = await platformRequest<{ supplier: Supplier | null }>(
    `query Supplier($id: ID!) { supplier(where: { id: $id }) { id name accountReference status organization { name } integrationProvider { name status } inventoryLotsCount inventoryLots(orderBy: [{ receivedAt: desc }], take: 50) { id lotNumber status receivedAt expirationDate quantityReceived quantityAvailable product { title } location { name } } } }`,
    { id },
  )
  const parent = { label: 'Suppliers', href: '/platform/suppliers' }
  if (!response.success || !response.data.supplier) return <TaskPage parent={parent} title="Supplier unavailable" description={response.success ? 'Not found' : response.error} />
  const supplier = response.data.supplier
  const received = supplier.inventoryLots.reduce((sum, lot) => sum + lot.quantityReceived, 0)

  return <TaskPage parent={parent} meta="Supplier" title={supplier.name} state={humanize(supplier.status)} tone={statusTone(supplier.status === 'pending_validation' ? 'pending_review' : supplier.status)} description={supplier.organization?.name} actions={<RecordDrawerButton listPath="suppliers" itemId={supplier.id} label="Edit" />}>
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-[6px] border border-border bg-card px-4 py-4 sm:grid-cols-4 sm:px-5">
      <Field label="Account">{supplier.accountReference ? <Mono>{supplier.accountReference}</Mono> : 'Not recorded'}</Field>
      <Field label="Lots received"><Mono>{supplier.inventoryLotsCount}</Mono></Field>
      <Field label="Units (last 50 lots)"><Mono>{received}</Mono></Field>
      <Field label="Integration">{supplier.integrationProvider ? `${supplier.integrationProvider.name} · ${humanize(supplier.integrationProvider.status)}` : 'None'}</Field>
    </dl>
    <TaskSection title="Status"><TransitionPills label="Supplier status" options={supplierActions(supplier)} /></TaskSection>
    <TaskSection title="Lots received" count={supplier.inventoryLotsCount} action={<Link href="/dashboard/platform/inventory/receive" className="text-[13px] font-medium underline underline-offset-4">Receive lot</Link>}>
      {supplier.inventoryLots.length ? <ListBand>{supplier.inventoryLots.map((lot) => <Link key={lot.id} href={`/dashboard/platform/inventory/${lot.id}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 bg-background px-3.5 py-2.5 text-sm hover:bg-muted/40">
        <span className="min-w-0"><TitleLine as="h3" titleClassName="text-sm" title={<>{lot.product?.title} · <span className="font-mono">{lot.lotNumber}</span></>} tone={statusTone(lot.status)} state={humanize(lot.status)} /><span className="block font-mono text-[11px] text-muted-foreground">Received {shortDate(lot.receivedAt)} · expires {shortDate(lot.expirationDate)}{lot.location ? ` · ${lot.location.name}` : ''}</span></span>
        <Mono className="text-right">{lot.quantityAvailable}/{lot.quantityReceived}</Mono>
      </Link>)}</ListBand> : <p className="text-sm text-muted-foreground">No lots received from this supplier.</p>}
    </TaskSection>
  </TaskPage>
}
