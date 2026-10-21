import { keystoneClient } from '@/features/dashboard/lib/keystoneClient'
import type { PharmacyOrderTaskProjection } from '@/features/pharmacy/contracts'
import { TaskPage, TaskSection } from '@/features/platform/components/TaskPage'
import { FulfillmentTaskActions } from '../components/FulfillmentTaskActions'
import { PaymentTaskActions } from '../components/PaymentTaskActions'

function money(amount: number, currency: string) { return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount / 100) }

export async function OrderTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await params
  const response = await keystoneClient<{ pharmacyOrderTask: PharmacyOrderTaskProjection }>(`query Task($orderId: ID!) { pharmacyOrderTask(orderId: $orderId) { id orderNumber status fulfillmentMethod subtotalAmount taxAmount deliveryAmount totalAmount currencyCode createdAt pickupAt deliveryWindow locationId locationName availableFulfillmentStatuses lines { id title sku ndc11 quantity unitPriceAmount lineTotalAmount prescriptionRequirement } fulfillment { id method status readyAt handedOffAt assignedToName } payment { id status amount currencyCode processedAt tenderMethod cashReceivedAmount changeDueAmount providerName providerCode } } }`, { orderId })
  if (!response.success) return <TaskPage parent={{ label: 'Orders', href: '/platform/orders' }} title="Order unavailable" description={response.error} />
  const order = response.data.pharmacyOrderTask
  return <TaskPage parent={{ label: 'Orders', href: '/platform/orders' }} meta={`Order · ${order.status.replaceAll('_', ' ')}`} title={order.orderNumber} description={`${order.locationName} · ${order.fulfillmentMethod} · ${money(order.totalAmount, order.currencyCode)}`}>
    <TaskSection title="Items">{order.lines.map((line) => <div key={line.id} className="grid gap-2 border-b py-3 text-sm last:border-0 sm:grid-cols-[1fr_5rem_8rem]"><span><strong>{line.title}</strong><br /><span className="text-xs text-muted-foreground">{line.sku}</span></span><span>{line.quantity} ×</span><span>{money(line.lineTotalAmount, order.currencyCode)}</span></div>)}</TaskSection>
    <TaskSection title="Payment & refund"><PaymentTaskActions order={order} /></TaskSection>
    <TaskSection title="Fulfillment"><FulfillmentTaskActions order={order} /></TaskSection>
  </TaskPage>
}
