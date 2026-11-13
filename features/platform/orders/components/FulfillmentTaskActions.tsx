'use client'

import { useState, useTransition } from 'react'
import { RxButton as Button } from '@/features/platform/components/rx-ui'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import type { PharmacyOrderTaskProjection } from '@/features/pharmacy/contracts'
import { currentFulfillmentSelection } from './fulfillmentSelection'
import { transitionFulfillmentAction } from '../actions'
import { unwrapAction } from '@/features/platform/lib/action-result'
import { OptionSelect } from '@/features/platform/components/OptionSelect'

const FULFILLMENT_LABELS: Record<string, string> = { preparing: 'Preparing', ready: 'Ready for pickup', out_for_delivery: 'Out for delivery', handed_off: 'Picked up', cancelled: 'Cancelled' }

export function FulfillmentTaskActions({ order }: { order: PharmacyOrderTaskProjection }) {
  const options = order.availableFulfillmentStatuses
  const [status, setStatus] = useState(options[0] || '')
  const selectedStatus = currentFulfillmentSelection(options, status)
  const [reason, setReason] = useState('')
  const [attested, setAttested] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  if (!order.fulfillment) return <p className="text-sm text-muted-foreground">No fulfillment record is available.</p>
  if (!options.length) return <p className="text-sm text-muted-foreground">{order.fulfillment.status === 'cancelled' ? 'Order closed (cancelled).' : order.fulfillment.status === 'handed_off' ? 'Order completed.' : 'No next step for this order.'}</p>
  const submit = () => { setMessage(''); setError(''); startTransition(() => unwrapAction(transitionFulfillmentAction({ fulfillmentId: order.fulfillment!.id, orderId: order.id, status: selectedStatus, reason, attested })).then((result) => { setMessage(`Order moved to ${FULFILLMENT_LABELS[result.status] || result.status.replaceAll('_', ' ')}.`); setAttested(false); setReason('') }).catch((cause) => setError(cause instanceof Error ? cause.message : 'Transition failed'))) }
  return <div className="space-y-4"><label className="text-sm">Next status<OptionSelect value={selectedStatus} onValueChange={(value) => setStatus(value)} className="mt-2">{options.map((entry) => <option key={entry} value={entry}>{FULFILLMENT_LABELS[entry] || entry.replaceAll('_', ' ')}</option>)}</OptionSelect></label><label className="text-sm">Operational reason<Input value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2" /></label><label className="flex items-start gap-3 text-sm"><Checkbox checked={attested} onCheckedChange={(checked) => setAttested(checked === true)} className="mt-0.5" />I am the authorized human recording this fulfillment transition. Handoff and cancellation create explicit approval evidence.</label><Button id="record-fulfillment-transition" disabled={pending || !selectedStatus || !attested || reason.trim().length < 3} onClick={() => { if (selectedStatus === 'cancelled') { setConfirmOpen(true); return } submit() }}>Record transition</Button><AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Cancel order {order.orderNumber}?</AlertDialogTitle><AlertDialogDescription>The order closes and cannot be reopened. Refund any payment first.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { setConfirmOpen(false); submit() }}>Confirm</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>{message && <p role="status" className="rounded-[5px] bg-teal-50 p-3 text-sm text-teal-800">{message}</p>}{error && <p role="alert" className="rounded-[5px] bg-red-50 p-3 text-sm text-red-800">{error}</p>}</div>
}
