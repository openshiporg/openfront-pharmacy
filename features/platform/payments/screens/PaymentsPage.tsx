import Link from 'next/link'

import { PageContainer } from '@/features/dashboard/components/PageContainer'
import { basePath } from '@/features/dashboard/lib/config'
import { keystoneClient } from '@/features/dashboard/lib/keystoneClient'
import { RecordDrawerButton } from '@/features/platform/components/RecordDrawerButton'
import { TaskSection } from '@/features/platform/components/TaskPage'
import { TransitionPills } from '@/features/platform/components/TransitionPills'
import { Callout, Count, Dot, EmptyBand, Field, ListBand, Mono, PillLink, TitleLine, Track, humanize, statusTone } from '@/features/platform/components/rx-ui'
import { money, shortDate } from '../../lib/mutate'
import { reconcileSession, setProviderInstalled } from '../actions'
import { CashPolicyForm } from '../components/CashPolicyForm'

type Payment = { id: string; amount: number; currencyCode: string; status: string; tenderMethod: string; processedAt?: string | null; createdAt: string; order?: { id: string; orderNumber: string } | null; provider?: { name: string } | null; location?: { name: string } | null }
type Session = { id: string; amount: number; currencyCode: string; status: string; reconciliationStatus: string; failureReason?: string | null; createdAt: string; provider?: { name: string } | null; location?: { name: string } | null }
type Provider = { id: string; name: string; code: string; isInstalled: boolean; createPaymentFunction: string; paymentsCount: number }
type Organization = { id: string; name: string; cashSalesEnabled: boolean; cashTaxRateBps: number; cashTaxPolicyReference?: string | null; cashPolicyReviewedAt?: string | null; cashPolicyReviewedBy?: { name: string } | null }

const STATUS_TABS = [['captured', 'Captured'], ['pending', 'Pending'], ['refund_pending', 'Refund pending'], ['refunded', 'Refunded'], ['failed', 'Failed']] as const
const NEEDS_RECONCILIATION = ['settled_unordered', 'compensation_pending', 'manual_review']

export async function PaymentsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  const status = typeof params?.status === 'string' && STATUS_TABS.some(([value]) => value === params.status) ? params.status : null
  const response = await keystoneClient<{ payments: Payment[]; paymentSessions: Session[]; paymentProviders: Provider[]; organizations: Organization[] }>(
    `query Payments($where: PaymentWhereInput!, $sessions: PaymentSessionWhereInput!) {
      payments(where: $where, orderBy: [{ createdAt: desc }], take: 100) { id amount currencyCode status tenderMethod processedAt createdAt order { id orderNumber } provider { name } location { name } }
      paymentSessions(where: $sessions, orderBy: [{ createdAt: desc }], take: 50) { id amount currencyCode status reconciliationStatus failureReason createdAt provider { name } location { name } }
      paymentProviders(orderBy: [{ name: asc }]) { id name code isInstalled createPaymentFunction paymentsCount }
      organizations(take: 20, orderBy: { name: asc }) { id name cashSalesEnabled cashTaxRateBps cashTaxPolicyReference cashPolicyReviewedAt cashPolicyReviewedBy { name } }
    }`,
    { where: status ? { status: { equals: status } } : {}, sessions: { reconciliationStatus: { in: NEEDS_RECONCILIATION } } },
  )
  const data = response.success ? response.data : null
  const captured = (data?.payments || []).filter((payment) => payment.status === 'captured').reduce((sum, payment) => sum + payment.amount, 0)
  const href = (value: string | null) => `${basePath}/platform/payments${value ? `?status=${value}` : ''}`

  const header = <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
    <h1 className="text-2xl font-semibold tracking-tight text-foreground">Payments</h1>
    {data && <span className="inline-flex items-baseline gap-1.5 text-sm text-muted-foreground"><Dot tone={data.paymentSessions.length ? 'warn' : 'ok'} />{data.paymentSessions.length ? `${data.paymentSessions.length} to reconcile` : 'Reconciled'}</span>}
  </div>

  return <PageContainer title="Payments" header={header} breadcrumbs={[{ type: 'link', label: 'Dashboard', href: basePath }, { type: 'page', label: 'Platform' }, { type: 'page', label: 'Payments' }]}>
    <div className="space-y-5 px-4 pb-8 md:px-6">
      {!response.success && <Callout tone="danger" title="Couldn't load payments">{response.error}</Callout>}
      {data && <>
        {data.paymentSessions.length > 0 && <TaskSection title="Needs reconciliation" count={data.paymentSessions.length}>
          <ListBand>{data.paymentSessions.map((session) => <div key={session.id} className="flex flex-wrap items-center justify-between gap-3 bg-background px-3.5 py-2.5 text-sm">
            <div className="min-w-0"><TitleLine as="h3" titleClassName="text-sm" title={<Mono>{money(session.amount, session.currencyCode)}</Mono>} tone="warn" state={humanize(session.reconciliationStatus)} /><p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{session.provider?.name} · {humanize(session.status)} · {shortDate(session.createdAt)}{session.location ? ` · ${session.location.name}` : ''}</p>{session.failureReason && <p className="mt-0.5 text-xs text-muted-foreground">{session.failureReason}</p>}</div>
            <TransitionPills label="Reconcile session" options={[{ label: 'Reconcile', action: reconcileSession.bind(null, session.id) }]} />
          </div>)}</ListBand>
        </TaskSection>}

        <section aria-labelledby="payments-ledger" className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-3"><h2 id="payments-ledger" className="flex items-baseline gap-2 text-sm font-semibold">Ledger <Count>{data.payments.length}</Count></h2><span className="font-mono text-[11px] text-muted-foreground">Captured on this page {money(captured)}</span></div>
          <Track label="Payment status"><PillLink href={href(null)} active={!status}>All</PillLink>{STATUS_TABS.map(([value, label]) => <PillLink key={value} href={href(value)} active={status === value}><Dot tone={statusTone(value)} className="size-1.5 translate-y-0" />{label}</PillLink>)}</Track>
          {data.payments.length ? <ListBand className="bg-border/60">{data.payments.map((payment) => <div key={payment.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 bg-background px-4 py-3 text-sm sm:px-5">
            <div className="min-w-0"><TitleLine as="h3" titleClassName="text-sm" title={payment.order ? <Link href={`${basePath}/platform/orders/${payment.order.id}`} className="font-mono hover:underline hover:underline-offset-4">{payment.order.orderNumber}</Link> : 'No order'} tone={statusTone(payment.status)} state={humanize(payment.status)} /><p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{payment.tenderMethod === 'cash' ? 'Cash' : payment.provider?.name || 'Provider'} · {shortDate(payment.processedAt || payment.createdAt)}{payment.location ? ` · ${payment.location.name}` : ''}</p></div>
            <Mono className="text-right">{money(payment.amount, payment.currencyCode)}</Mono>
          </div>)}</ListBand> : <EmptyBand>No payments{status ? ` ${humanize(status)}` : ''}</EmptyBand>}
        </section>

        <div id="providers"><TaskSection title="Payment providers" count={data.paymentProviders.length} action={<RecordDrawerButton listPath="payment-providers" label="Add provider" variant="outline" />}>
          {data.paymentProviders.length ? <ListBand>{data.paymentProviders.map((provider) => <div key={provider.id} className="flex flex-wrap items-center justify-between gap-3 bg-background px-3.5 py-2.5 text-sm">
            <div className="min-w-0"><TitleLine as="h3" titleClassName="text-sm" title={provider.name} tone={provider.isInstalled ? 'ok' : 'muted'} state={provider.isInstalled ? 'Installed' : 'Not installed'} /><p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{provider.code} · {provider.createPaymentFunction === 'manual' ? 'Pay at pickup' : provider.createPaymentFunction} · {provider.paymentsCount} payments</p></div>
            <div className="flex flex-wrap items-center gap-1.5"><TransitionPills label={`${provider.name} install`} options={[{ label: provider.isInstalled ? 'Uninstall' : 'Install', action: setProviderInstalled.bind(null, provider.id, !provider.isInstalled), danger: provider.isInstalled }]} /><RecordDrawerButton listPath="payment-providers" itemId={provider.id} label="Edit" /></div>
          </div>)}</ListBand> : <p className="text-sm text-muted-foreground">No payment providers.</p>}
        </TaskSection></div>

        {data.organizations.map((organization) => <TaskSection key={organization.id} title={`Cash and sales tax · ${organization.name}`}>
          <dl className="mb-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
            <Field label="Cash sales"><span className="inline-flex items-baseline gap-1.5"><Dot tone={organization.cashSalesEnabled ? 'ok' : 'warn'} />{organization.cashSalesEnabled ? 'On' : 'Off'}</span></Field>
            <Field label="Tax rate"><Mono>{(organization.cashTaxRateBps / 100).toFixed(2)}%</Mono></Field>
            <Field label="Policy">{organization.cashTaxPolicyReference || 'Not recorded'}</Field>
            <Field label="Reviewed">{organization.cashPolicyReviewedAt ? `${shortDate(organization.cashPolicyReviewedAt)}${organization.cashPolicyReviewedBy ? ` · ${organization.cashPolicyReviewedBy.name}` : ''}` : 'Never'}</Field>
          </dl>
          <CashPolicyForm organizationId={organization.id} taxRateBps={organization.cashTaxRateBps} />
        </TaskSection>)}
      </>}
    </div>
  </PageContainer>
}
