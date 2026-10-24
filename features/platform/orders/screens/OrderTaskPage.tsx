import { platformRequest } from '@/features/platform/lib/request'
import type { PharmacyOrderTaskProjection } from '@/features/pharmacy/contracts'
import { TaskPage, TaskSection } from '@/features/platform/components/TaskPage'
import { Field, Mono, humanize, statusTone } from '@/features/platform/components/rx-ui'
import { FulfillmentTaskActions } from '../components/FulfillmentTaskActions'
import { PaymentTaskActions } from '../components/PaymentTaskActions'
import { formatDateTime } from '@/features/platform/lib/dates'
import { getStoreTimeZone } from '@/features/platform/lib/store-time-zone'

function money(amount: number, currency: string) { return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount / 100) }

export async function OrderTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const timeZone = await getStoreTimeZone()
  const { id: orderId } = await params
  const response = await platformRequest<{ pharmacyOrderTask: PharmacyOrderTaskProjection }>(`query Task($orderId: ID!) { pharmacyOrderTask(orderId: $orderId) { id orderNumber status fulfillmentMethod customerName customerEmail customerPhone subtotalAmount taxAmount deliveryAmount totalAmount currencyCode createdAt pickupAt deliveryWindow locationId locationName availableFulfillmentStatuses lines { id title sku ndc11 quantity unitPriceAmount lineTotalAmount prescriptionRequirement } fulfillment { id method status readyAt handedOffAt assignedToName } payment { id status amount currencyCode processedAt tenderMethod cashReceivedAmount changeDueAmount providerName providerCode } } }`, { orderId })
  if (!response.success) return <TaskPage parent={{ label: 'Orders', href: '/platform/orders' }} title="Order unavailable" description={response.error} />
  const order = response.data.pharmacyOrderTask
  const state = order.fulfillment?.status || order.status
  return <TaskPage parent={{ label: 'Orders', href: '/platform/orders' }} meta={`Order · ${humanize(order.fulfillmentMethod)}`} title={order.orderNumber} state={humanize(state)} tone={statusTone(state)} description={order.locationName}>
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl bg-muted/40 px-4 py-4 ring-1 ring-inset ring-border/60 sm:grid-cols-4 sm:px-5">
      {(order.customerName || order.customerEmail || order.customerPhone) && <Field label="Customer" className="col-span-2">{order.customerName || 'Name not given'}{order.customerPhone && <a href={`tel:${order.customerPhone}`} className="block font-mono text-xs text-muted-foreground hover:underline">{order.customerPhone}</a>}{order.customerEmail && <span className="block truncate text-xs text-muted-foreground">{order.customerEmail}</span>}</Field>}
      <Field label="Total"><Mono>{money(order.totalAmount, order.currencyCode)}</Mono></Field>
      <Field label="Payment">{order.payment ? humanize(order.payment.status) : 'Not recorded'}</Field>
      <Field label="Placed">{formatDateTime(order.createdAt, timeZone)}</Field>
      <Field label={order.fulfillmentMethod === 'delivery' ? 'Delivery window' : 'Pickup'}>{order.fulfillmentMethod === 'delivery' ? (order.deliveryWindow || 'Not set') : (order.pickupAt ? formatDateTime(order.pickupAt, timeZone) : 'Not set')}</Field>
    </dl>
    <TaskSection title="Items" count={order.lines.length}>
      <div className="divide-y">{order.lines.map((line) => <div key={line.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 py-3 text-sm first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_4rem_7rem]">
        <span className="min-w-0"><span className="font-semibold">{line.title}</span><span className="block font-mono text-[11px] text-muted-foreground">{line.sku}{line.ndc11 ? ` · NDC ${line.ndc11}` : ''}{line.prescriptionRequirement !== 'none' ? ` · ${humanize(line.prescriptionRequirement)}` : ''}</span></span>
        <Mono className="text-muted-foreground sm:text-right">{line.quantity}×</Mono>
        <Mono className="col-start-2 row-start-1 text-right sm:col-start-auto sm:row-start-auto">{money(line.lineTotalAmount, order.currencyCode)}</Mono>
      </div>)}</div>
      <dl className="mt-4 grid gap-1.5 border-t border-dashed pt-3 text-sm">
        <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd><Mono>{money(order.subtotalAmount, order.currencyCode)}</Mono></dd></div>
        <div className="flex justify-between"><dt className="text-muted-foreground">Tax</dt><dd><Mono>{money(order.taxAmount, order.currencyCode)}</Mono></dd></div>
        {order.deliveryAmount > 0 && <div className="flex justify-between"><dt className="text-muted-foreground">Delivery</dt><dd><Mono>{money(order.deliveryAmount, order.currencyCode)}</Mono></dd></div>}
        <div className="flex justify-between font-semibold"><dt>Total</dt><dd><Mono>{money(order.totalAmount, order.currencyCode)}</Mono></dd></div>
      </dl>
    </TaskSection>
    <TaskSection title="Fulfillment"><FulfillmentTaskActions order={order} /></TaskSection>
    <TaskSection title="Payment and refund"><PaymentTaskActions order={order} /></TaskSection>
  </TaskPage>
}
