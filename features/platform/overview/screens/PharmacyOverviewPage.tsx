import Link from 'next/link'
import { ChevronRight, Plus } from 'lucide-react'

import { PageBreadcrumbs } from '@/features/dashboard/components/PageBreadcrumbs'
import { basePath } from '@/features/dashboard/lib/config'
import { platformRequest } from '@/features/platform/lib/request'
import type { PharmacyInventoryWorklistProjection, PharmacyOrderWorklistProjection, PharmacyPrescriptionQueueProjection, PharmacyRecallQueueProjection } from '@/features/pharmacy/contracts'
import { expiryContext } from '@/features/platform/components/workflowQueue'
import { Callout, Count, Dot, ListBand, RaisedLink, primaryPillClass, type DotTone } from '@/features/platform/components/rx-ui'
import { platformNavItems } from '@/features/platform/lib/navigation'

type Page<T> = { items: T[]; totalCount: number; hasMore: boolean }

type Metric = { label: string; value: number }

type Queue = {
  title: string
  href: string
  total: number
  partial: boolean
  lead: Metric
  tone: DotTone
  state: string
  metrics: Metric[]
  error?: string
  action?: { href: string; label: string }
}

const count = <T,>(items: T[], test: (item: T) => boolean) => items.reduce((sum, item) => sum + (test(item) ? 1 : 0), 0)

async function loadQueue<K extends string, T>(key: K, query: string) {
  const response = await platformRequest<Record<K, Page<T>>>(query)
  return response.success ? { page: response.data[key], error: undefined } : { page: null, error: response.error }
}

function QueueCard({ queue }: { queue: Queue }) {
  return <section aria-labelledby={`queue-${queue.href}`} className="flex flex-col bg-background">
    <div className="flex items-baseline justify-between gap-3 px-4 pt-4 sm:px-5">
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
        <h2 id={`queue-${queue.href}`} className="text-[15px] font-semibold tracking-tight text-foreground">{queue.title}</h2>
        <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap text-xs text-muted-foreground"><Dot tone={queue.tone} />{queue.state}</span>
      </div>
      <Count>{queue.total}{queue.partial ? '+' : ''}</Count>
    </div>
    {queue.error
      ? <div className="px-4 py-4 sm:px-5"><Callout tone="muted">{queue.error}</Callout></div>
      : <>
        <div className="px-4 pt-3 sm:px-5">
          <p className="font-mono text-[2.25rem] leading-none tabular-nums text-foreground">{queue.lead.value}</p>
          <p className="mt-1.5 text-[13px] text-muted-foreground">{queue.lead.label}</p>
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-px border-y bg-border">
          {queue.metrics.map((metric) => <div key={metric.label} className="bg-background px-3 py-2.5 sm:px-4">
            <dt className="truncate font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">{metric.label}</dt>
            <dd className="mt-0.5 font-mono text-[15px] tabular-nums text-foreground">{metric.value}</dd>
          </div>)}
        </dl>
      </>}
    <div className="mt-auto flex items-center justify-between gap-2 px-4 py-3 sm:px-5">
      {queue.action ? <Link href={queue.action.href} className="inline-flex min-h-9 items-center gap-1 rounded-full px-2.5 text-[13px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground max-sm:min-h-10"><Plus aria-hidden="true" className="size-3.5" />{queue.action.label}</Link> : <span />}
      <RaisedLink href={queue.href}>Open<ChevronRight aria-hidden="true" className="size-3.5" /></RaisedLink>
    </div>
  </section>
}

export async function PharmacyOverviewPage() {
  const [prescriptions, orders, inventory, recalls] = await Promise.all([
    loadQueue<'pharmacyPrescriptionWorklist', PharmacyPrescriptionQueueProjection>('pharmacyPrescriptionWorklist', `query { pharmacyPrescriptionWorklist(first: 50) { items { id status openRefillCount openTransferCount sourceVerificationStatus prescriberVerificationStatus } totalCount hasMore } }`),
    loadQueue<'pharmacyOrderQueue', PharmacyOrderWorklistProjection['items'][number]>('pharmacyOrderQueue', `query { pharmacyOrderQueue(first: 50) { items { id status fulfillmentStatus paymentStatus hasPrescriptionLines } totalCount hasMore } }`),
    loadQueue<'pharmacyInventoryQueue', PharmacyInventoryWorklistProjection['items'][number]>('pharmacyInventoryQueue', `query { pharmacyInventoryQueue(first: 50) { items { id status expirationDate quantityQuarantined activeRecallCount openExcursionCount coldChainRequired coldChainEvidenceComplete } totalCount hasMore } }`),
    loadQueue<'pharmacyRecallWorklist', PharmacyRecallQueueProjection>('pharmacyRecallWorklist', `query { pharmacyRecallWorklist(first: 50) { items { id status classification unresolvedExposureCount quarantinedLotCount affectedLotCount } totalCount hasMore } }`),
  ])

  const [refills, requests, sessions] = await Promise.all([
    platformRequest<{ refillRequestsCount: number }>('query { refillRequestsCount(where: { status: { in: ["requested", "under_review", "prescriber_contacted"] } }) }'),
    platformRequest<{ pharmacyPrescriptionRequestQueue: Array<{ id: string }> }>('query { pharmacyPrescriptionRequestQueue(status: "requested") { id } }'),
    platformRequest<{ paymentSessionsCount: number }>('query { paymentSessionsCount(where: { reconciliationStatus: { in: ["settled_unordered", "compensation_pending", "manual_review"] } }) }'),
  ])
  const waiting = [
    { label: 'Refill requests', href: `${basePath}/platform/refills`, value: refills.success ? refills.data.refillRequestsCount : null },
    { label: 'Online requests', href: `${basePath}/platform/requests`, value: requests.success ? requests.data.pharmacyPrescriptionRequestQueue.length : null },
    { label: 'Payments to reconcile', href: `${basePath}/platform/payments`, value: sessions.success ? sessions.data.paymentSessionsCount : null },
  ].filter((entry) => entry.value !== null)
  const onlineRequests = requests.success ? requests.data.pharmacyPrescriptionRequestQueue.length : 0

  const rx = prescriptions.page?.items ?? []
  const rxReview = count(rx, (item) => ['draft', 'pending_review', 'needs_information'].includes(item.status))
  const rxRefills = rx.reduce((sum, item) => sum + (item.openRefillCount || 0), 0)
  const rxReady = count(rx, (item) => ['approved', 'ready_to_dispense', 'partially_dispensed'].includes(item.status))

  const ord = orders.page?.items ?? []
  const ordToPrepare = count(ord, (item) => ['pending', 'preparing', 'in_progress'].includes(item.fulfillmentStatus))
  const ordReady = count(ord, (item) => ['ready', 'ready_for_pickup'].includes(item.fulfillmentStatus))
  const ordPayment = count(ord, (item) => ['payment_failed', 'refund_pending'].includes(item.paymentStatus))
  const ordRx = count(ord, (item) => item.hasPrescriptionLines && !['completed', 'cancelled'].includes(item.status))

  const lots = inventory.page?.items ?? []
  const lotsExpiring = count(lots, (lot) => expiryContext(lot.expirationDate).priority !== 'routine')
  const lotsHeld = count(lots, (lot) => lot.quantityQuarantined > 0 || ['quarantined', 'hold'].includes(lot.status))
  const lotsRecall = count(lots, (lot) => lot.activeRecallCount > 0)
  const lotsColdChain = count(lots, (lot) => lot.coldChainRequired && !lot.coldChainEvidenceComplete)

  const rec = recalls.page?.items ?? []
  const recOpen = count(rec, (item) => !['closed', 'resolved'].includes(item.status))
  const recClassOne = count(rec, (item) => item.classification === 'class_i' && !['closed', 'resolved'].includes(item.status))
  const recOutreach = rec.reduce((sum, item) => sum + (item.unresolvedExposureCount || 0), 0)
  const recGap = count(rec, (item) => item.quarantinedLotCount < item.affectedLotCount)

  const queues: Queue[] = [
    { title: 'Prescriptions', href: `${basePath}/platform/prescriptions`, total: prescriptions.page?.totalCount ?? 0, partial: Boolean(prescriptions.page?.hasMore), error: prescriptions.error, lead: { label: 'Awaiting pharmacist review', value: rxReview }, tone: rxReview || onlineRequests || rxRefills ? 'warn' : 'ok', state: rxReview ? 'Review' : onlineRequests ? 'Online requests' : rxRefills ? 'Refills' : 'Clear', metrics: [{ label: 'Refills', value: rxRefills }, { label: 'Online', value: onlineRequests }, { label: 'To fill', value: rxReady }], action: { href: `${basePath}/platform/prescriptions/intake`, label: 'New' } },
    { title: 'Orders', href: `${basePath}/platform/orders`, total: orders.page?.totalCount ?? 0, partial: Boolean(orders.page?.hasMore), error: orders.error, lead: { label: 'To prepare', value: ordToPrepare }, tone: ordPayment ? 'danger' : ordToPrepare ? 'info' : 'ok', state: ordPayment ? 'Payment issue' : ordToPrepare ? 'Open' : 'Clear', metrics: [{ label: 'Ready', value: ordReady }, { label: 'Payment', value: ordPayment }, { label: 'With Rx', value: ordRx }] },
    { title: 'Inventory', href: `${basePath}/platform/inventory`, total: inventory.page?.totalCount ?? 0, partial: Boolean(inventory.page?.hasMore), error: inventory.error, lead: { label: 'Expired or expiring in 60 days', value: lotsExpiring }, tone: lotsRecall || lotsColdChain ? 'danger' : lotsExpiring || lotsHeld ? 'warn' : 'ok', state: lotsRecall || lotsColdChain ? 'Hold' : lotsExpiring || lotsHeld ? 'Review' : 'Clear', metrics: [{ label: 'Quarantined', value: lotsHeld }, { label: 'Recall', value: lotsRecall }, { label: 'Cold chain', value: lotsColdChain }], action: { href: `${basePath}/platform/inventory/receive`, label: 'Receive' } },
    { title: 'Recalls', href: `${basePath}/platform/recalls`, total: recalls.page?.totalCount ?? 0, partial: Boolean(recalls.page?.hasMore), error: recalls.error, lead: { label: 'Open recalls', value: recOpen }, tone: recClassOne ? 'danger' : recOpen ? 'warn' : 'ok', state: recClassOne ? 'Class I open' : recOpen ? 'Open' : 'Clear', metrics: [{ label: 'Class I', value: recClassOne }, { label: 'Outreach', value: recOutreach }, { label: 'Lot gaps', value: recGap }], action: { href: `${basePath}/platform/recalls/open`, label: 'Open recall' } },
  ]
  const urgent = queues.filter((queue) => queue.tone === 'danger').length
  // Any queue that isn't clear, plus anything waiting outside the four queues.
  const open = queues.filter((queue) => queue.tone !== 'ok').length + waiting.filter((entry) => entry.value).length
  const destinations = platformNavItems.filter((item) => !['/platform/overview', '/platform/prescriptions', '/platform/orders', '/platform/inventory', '/platform/recalls'].includes(item.href))

  return (
    <section className="flex flex-col overflow-hidden">
      <PageBreadcrumbs
        items={[
          { type: 'link', label: 'Dashboard', href: '/' },
          { type: 'page', label: 'Platform' },
          { type: 'page', label: 'Overview' },
        ]}
      />
      <div className="w-full max-w-6xl space-y-6 p-4 md:p-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Overview</h1>
            <span className="inline-flex items-baseline gap-1.5 text-sm text-muted-foreground"><Dot tone={urgent ? 'danger' : open ? 'warn' : 'ok'} />{urgent ? `${urgent} ${urgent === 1 ? 'queue needs' : 'queues need'} action` : open ? `${open} ${open === 1 ? 'queue has' : 'queues have'} work waiting` : 'All queues clear'}</span>
          </div>
          <Link href={`${basePath}/platform/pos`} className={primaryPillClass}>Point of sale</Link>
        </header>

        <div className="grid gap-px overflow-hidden rounded-xl bg-border ring-1 ring-border sm:grid-cols-2 xl:grid-cols-4">
          {queues.map((queue) => <QueueCard key={queue.href} queue={queue} />)}
        </div>

        {waiting.length > 0 && <nav aria-label="Also waiting" className="grid gap-px overflow-hidden rounded-xl bg-border ring-1 ring-border sm:grid-cols-3">
          {waiting.map((entry) => <Link key={entry.href} href={entry.href} className="group flex items-center justify-between gap-3 bg-background px-4 py-3 hover:bg-muted/50">
            <span className="inline-flex items-baseline gap-2 text-sm font-medium text-foreground"><Dot tone={entry.value ? 'warn' : 'ok'} />{entry.label}</span>
            <span className="flex items-center gap-1.5 font-mono text-lg tabular-nums">{entry.value}<ChevronRight aria-hidden="true" className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" /></span>
          </Link>)}
        </nav>}

        <section aria-labelledby="overview-more">
          <h2 id="overview-more" className="mb-3 text-sm font-semibold text-foreground">Records and settings</h2>
          <ListBand className="grid bg-border/60 sm:grid-cols-2 sm:divide-y-0 sm:gap-px">
            {destinations.map((item) => {
              const Icon = item.icon
              return <Link key={item.href} href={`${basePath}${item.href}`} className="group flex min-h-14 items-center gap-3 bg-background px-4 py-3 transition-colors hover:bg-muted/50">
                {Icon && <Icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />}
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{item.title}</span>
                <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            })}
          </ListBand>
        </section>
      </div>
    </section>
  )
}
