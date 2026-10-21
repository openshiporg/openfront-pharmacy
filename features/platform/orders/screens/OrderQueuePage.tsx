import { keystoneClient } from '@/features/dashboard/lib/keystoneClient'
import type { PharmacyOrderWorklistProjection } from '@/features/pharmacy/contracts'
import { WorkflowQueuePage, type WorkflowPriority } from '@/features/platform/components/WorkflowQueuePage'
import { reportedAge, strongestPriority } from '@/features/platform/components/workflowQueue'

const orderStatuses = [
  ['pending', 'Pending'],
  ['review_required', 'Review required'],
  ['approved', 'Approved'],
  ['processing', 'Processing'],
  ['ready', 'Ready'],
  ['out_for_delivery', 'Out for delivery'],
  ['completed', 'Completed'],
  ['cancelled', 'Cancelled'],
] as const
const fulfillmentMethods = [
  ['pickup', 'Pickup'],
  ['delivery', 'Delivery'],
  ['pos', 'Point of sale'],
] as const

function orderDecision(fulfillmentStatus: string, paymentStatus: string) {
  if (paymentStatus === 'payment_failed') return { label: 'Resolve payment exception', hint: 'Review the recorded cash/payment evidence before any fulfillment transition.' }
  if (paymentStatus === 'refund_pending') return { label: 'Review refund evidence', hint: 'Complete the operator-authorized refund review; provider settlement is not implied.' }
  if (fulfillmentStatus === 'pending') return { label: 'Start pickup preparation', hint: 'Review immutable lines and prescription dependencies before recording preparation.' }
  if (['preparing', 'in_progress'].includes(fulfillmentStatus)) return { label: 'Review pickup readiness', hint: 'Confirm every line and required pharmacist decision before advancing fulfillment.' }
  if (['ready', 'ready_for_pickup'].includes(fulfillmentStatus)) return { label: 'Confirm pickup handoff', hint: 'Record the authorized physical handoff in the deep-confirmation task.' }
  return { label: 'Review order task', hint: 'Review current payment and fulfillment state; the server determines available transitions.' }
}

export async function OrderQueuePage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  const after = typeof params?.after === 'string' && params.after ? params.after : null
  const status = typeof params?.status === 'string' && params.status ? params.status : null
  const fulfillmentMethod = typeof params?.fulfillmentMethod === 'string' && params.fulfillmentMethod ? params.fulfillmentMethod : null
  const response = await keystoneClient<{ pharmacyOrderQueue: PharmacyOrderWorklistProjection }>(
    `query OrderWorklist($first: Int, $after: String, $status: String, $fulfillmentMethod: String) { pharmacyOrderQueue(first: $first, after: $after, status: $status, fulfillmentMethod: $fulfillmentMethod) { items { id orderNumber status fulfillmentMethod totalAmount currencyCode createdAt locationName lineItemCount hasPrescriptionLines fulfillmentId fulfillmentStatus paymentStatus } totalCount hasMore nextCursor } }`,
    { first: 50, after, status, fulfillmentMethod },
  )
  const worklist = response.success ? response.data.pharmacyOrderQueue : null
  const items = worklist ? worklist.items.map((order) => {
    const exceptions = [
      ['payment_failed', 'refund_pending'].includes(order.paymentStatus) ? `Payment state: ${order.paymentStatus.replaceAll('_', ' ')}` : '',
      ['exception', 'cancelled'].includes(order.status) ? `Order state: ${order.status.replaceAll('_', ' ')}` : '',
      order.hasPrescriptionLines ? 'Contains prescription items' : '',
      !order.fulfillmentId ? 'No fulfillment record' : '',
    ].filter(Boolean)
    const statePriority: WorkflowPriority = order.paymentStatus === 'payment_failed' || order.status === 'exception' ? 'critical' : order.paymentStatus === 'refund_pending' || order.hasPrescriptionLines ? 'attention' : 'routine'
    const priority = strongestPriority(statePriority, exceptions.length ? 'attention' : 'routine')
    const decision = orderDecision(order.fulfillmentStatus, order.paymentStatus)
    return {
      id: order.id,
      href: `/dashboard/platform/orders/${order.id}`,
      title: order.orderNumber,
      subtitle: `${order.lineItemCount} line item(s) · ${order.fulfillmentMethod.replaceAll('_', ' ')}`,
      state: order.status,
      priority,
      priorityLabel: priority === 'critical' ? 'Exception first' : priority === 'attention' ? 'Needs attention' : 'Routine pickup',
      ageLabel: reportedAge(order.createdAt),
      sortValue: new Date(order.createdAt).getTime(),
      location: order.locationName,
      exceptions,
      context: [
        { label: 'Fulfillment', value: order.fulfillmentStatus.replaceAll('_', ' ') },
        { label: 'Payment', value: order.paymentStatus.replaceAll('_', ' ') },
        { label: 'Total', value: new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currencyCode || 'USD' }).format((order.totalAmount || 0) / 100) },
        { label: 'Created', value: new Date(order.createdAt).toLocaleString() },
      ],
      nextDecision: decision.label,
      decisionHint: decision.hint,
    }
  }) : []
  const filters = new URLSearchParams()
  if (status) filters.set('status', status)
  if (fulfillmentMethod) filters.set('fulfillmentMethod', fulfillmentMethod)
  const filterQuery = filters.toString()
  const baseHref = `/dashboard/platform/orders${filterQuery ? `?${filterQuery}` : ''}`
  const nextPageHref = worklist?.hasMore && worklist.nextCursor
    ? `${baseHref}${filterQuery ? '&' : '?'}after=${encodeURIComponent(worklist.nextCursor)}`
    : undefined
  return <WorkflowQueuePage title="Orders" description="Manage pickup, delivery, and counter orders." items={items} totalCount={worklist?.totalCount} previousPageHref={after ? baseHref : undefined} nextPageHref={nextPageHref} filters={[
    { param: 'status', label: 'Status', allLabel: 'All statuses', value: status, options: orderStatuses },
    { param: 'fulfillmentMethod', label: 'Fulfillment', allLabel: 'All fulfillment', value: fulfillmentMethod, options: fulfillmentMethods },
  ]} emptyMessage="No orders yet" error={response.success ? undefined : response.error} />
}
