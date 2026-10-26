import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import { PageBreadcrumbs } from '@/features/dashboard/components/PageBreadcrumbs'
import { basePath } from '@/features/dashboard/lib/config'
import { platformRequest } from '@/features/platform/lib/request'
import type { PharmacyInventoryWorklistProjection, PharmacyOrderWorklistProjection, PharmacyPrescriptionQueueProjection, PharmacyRecallQueueProjection } from '@/features/pharmacy/contracts'
import { expiryContext } from '@/features/platform/components/workflowQueue'
import { Callout, Count, RaisedLink, StatusText, buttonClass, primaryPillClass, type DotTone } from '@/features/platform/components/rx-ui'
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
  // Everything that needs a pharmacist or technician now, most urgent first.
  const attention: Array<{ label: string; count: number; tone: DotTone; href: string; action: string }> = [
    { label: 'Class I recalls open', count: recClassOne, tone: 'danger' as const, href: `${basePath}/platform/recalls`, action: 'Review' },
    { label: 'Lots on recall', count: lotsRecall, tone: 'danger' as const, href: `${basePath}/platform/inventory`, action: 'Review' },
    { label: 'Cold-chain evidence missing', count: lotsColdChain, tone: 'danger' as const, href: `${basePath}/platform/inventory`, action: 'Review' },
    { label: 'Orders with a payment issue', count: ordPayment, tone: 'danger' as const, href: `${basePath}/platform/orders`, action: 'Resolve' },
    { label: 'Prescriptions awaiting pharmacist review', count: rxReview, tone: 'warn' as const, href: `${basePath}/platform/prescriptions`, action: 'Review' },
    { label: 'Online prescription requests', count: onlineRequests, tone: 'warn' as const, href: `${basePath}/platform/requests`, action: 'Review' },
    ...waiting.filter((entry) => entry.label !== 'Online requests').map((entry) => ({ label: entry.label, count: entry.value || 0, tone: 'warn' as const, href: entry.href, action: 'Open' })),
    { label: 'Orders to prepare', count: ordToPrepare, tone: 'info' as const, href: `${basePath}/platform/orders`, action: 'Prepare' },
    { label: 'Lots expired or expiring in 60 days', count: lotsExpiring, tone: 'warn' as const, href: `${basePath}/platform/inventory`, action: 'Review' },
    { label: 'Lots quarantined or on hold', count: lotsHeld, tone: 'warn' as const, href: `${basePath}/platform/inventory`, action: 'Review' },
    { label: 'Recall patient outreach outstanding', count: recOutreach, tone: 'warn' as const, href: `${basePath}/platform/recalls`, action: 'Contact' },
  ].filter((entry) => entry.count > 0)
  const urgent = attention.filter((entry) => entry.tone === 'danger').length
  const destinations = platformNavItems.filter((item) => !['/platform/overview', '/platform/prescriptions', '/platform/orders', '/platform/inventory', '/platform/recalls'].includes(item.href))
  const th = 'h-8 whitespace-nowrap px-3 text-left text-xs font-medium text-muted-foreground'

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
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="text-lg font-semibold tracking-tight text-foreground">Overview</h1>
            <StatusText tone={urgent ? 'danger' : attention.length ? 'warn' : 'ok'}>{urgent ? `${urgent} urgent` : attention.length ? `${attention.length} waiting` : 'All queues clear'}</StatusText>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`${basePath}/platform/prescriptions/intake`} className={buttonClass}>New prescription</Link>
            <Link href={`${basePath}/platform/inventory/receive`} className={buttonClass}>Receive stock</Link>
            <Link href={`${basePath}/platform/pos`} className={primaryPillClass}>Point of sale</Link>
          </div>
        </header>

        <section aria-labelledby="overview-attention">
          <h2 id="overview-attention" className="mb-2 flex items-baseline gap-2 text-[13px] font-semibold text-foreground">Needs attention {attention.length > 0 && <Count>{attention.length}</Count>}</h2>
          {attention.length
            ? <div className="overflow-x-auto rounded-[6px] border border-border bg-card"><table className="w-full min-w-[420px] border-collapse text-[13px]">
              <thead className="bg-muted/50"><tr className="border-b border-border"><th scope="col" className={th}>Item</th><th scope="col" className={`${th} text-right`}>Count</th><th scope="col" className={th}><span className="sr-only">Action</span></th></tr></thead>
              <tbody>{attention.map((entry) => <tr key={entry.label} className="border-b border-border/70 last:border-b-0 hover:bg-muted/30">
                <td className="px-3 py-2"><StatusText tone={entry.tone}>{entry.label}</StatusText></td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">{entry.count}</td>
                <td className="w-px px-3 py-1.5 text-right"><Link href={entry.href} className={buttonClass}>{entry.action}</Link></td>
              </tr>)}</tbody>
            </table></div>
            : <Callout tone="muted" title="Nothing needs attention">Every queue below is clear.</Callout>}
        </section>

        <section aria-labelledby="overview-queues">
          <h2 id="overview-queues" className="mb-2 text-[13px] font-semibold text-foreground">Queues</h2>
          <div className="overflow-x-auto rounded-[6px] border border-border bg-card"><table className="w-full min-w-[760px] border-collapse text-[13px]">
            <thead className="bg-muted/50"><tr className="border-b border-border"><th scope="col" className={th}>Queue</th><th scope="col" className={`${th} text-right`}>Records</th><th scope="col" className={th}>Lead</th><th scope="col" className={th}>Also</th><th scope="col" className={th}>State</th><th scope="col" className={th}><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>{queues.map((queue) => <tr key={queue.href} className="border-b border-border/70 align-baseline last:border-b-0 hover:bg-muted/30">
              <td className="px-3 py-2.5 font-medium"><Link href={queue.href} className="underline-offset-4 hover:underline">{queue.title}</Link></td>
              <td className="px-3 py-2.5 text-right tabular-nums">{queue.total}{queue.partial ? '+' : ''}</td>
              <td className="px-3 py-2.5">{queue.error ? <span className="text-muted-foreground">{queue.error}</span> : <><span className="font-semibold tabular-nums">{queue.lead.value}</span> <span className="text-muted-foreground">{queue.lead.label.toLowerCase()}</span></>}</td>
              <td className="px-3 py-2.5 text-muted-foreground">{!queue.error && queue.metrics.map((metric) => `${metric.label} ${metric.value}`).join(' · ')}</td>
              <td className="whitespace-nowrap px-3 py-2.5"><StatusText tone={queue.tone}>{queue.state}</StatusText></td>
              <td className="px-3 py-1.5 text-right"><div className="inline-flex gap-1.5">{queue.action && <Link href={queue.action.href} className={buttonClass}>{queue.action.label}</Link>}<RaisedLink href={queue.href}>Open<ChevronRight aria-hidden="true" className="size-3.5" /></RaisedLink></div></td>
            </tr>)}</tbody>
          </table></div>
        </section>

        <section aria-labelledby="overview-more">
          <h2 id="overview-more" className="mb-2 text-[13px] font-semibold text-foreground">Records and settings</h2>
          <nav aria-label="Records and settings" className="grid gap-x-6 rounded-[6px] border border-border bg-card px-2 py-2 sm:grid-cols-2 lg:grid-cols-3">
            {destinations.map((item) => {
              const Icon = item.icon
              return <Link key={item.href} href={`${basePath}${item.href}`} className="flex min-h-9 items-center gap-2.5 rounded-[5px] px-2 text-[13px] font-medium text-foreground transition-colors hover:bg-muted">
                {Icon && <Icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />}
                <span className="min-w-0 flex-1 truncate">{item.title}</span>
              </Link>
            })}
          </nav>
        </section>
      </div>
    </section>
  )
}
