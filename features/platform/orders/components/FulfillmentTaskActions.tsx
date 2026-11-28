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

const ACTION_LABELS: Record<string, string> = { preparing: 'Mark preparing', ready: 'Mark ready for pickup', out_for_delivery: 'Mark out for delivery', handed_off: 'Mark picked up', cancelled: 'Cancel order' }
const COMMON_REASONS: Record<string, string[]> = {
  preparing: ['Started preparing the order'],
  ready: ['Order bagged and on the pickup shelf'],
  out_for_delivery: ['Handed to the delivery driver'],
  handed_off: ['Handed to the customer at the counter', 'Picked up by someone the customer sent'],
  cancelled: ['Customer asked to cancel', 'Item out of stock'],
}
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
  const submit = () => { setMessage(''); setError(''); startTransition(() => unwrapAction(transitionFulfillmentAction({ fulfillmentId: order.fulfillment!.id, orderId: order.id, status: selectedStatus, reason: reason.trim() || (FULFILLMENT_LABELS[selectedStatus] || selectedStatus), attested: needsApproval ? attested : true })).then((result) => { setMessage(`Order moved to ${FULFILLMENT_LABELS[result.status] || result.status.replaceAll('_', ' ')}.`); setAttested(false); setReason('') }).catch((cause) => setError(cause instanceof Error ? cause.message : 'The order could not be updated. Try again.'))) }
  const needsApproval = selectedStatus === 'handed_off' || selectedStatus === 'cancelled'
  const reasons = COMMON_REASONS[selectedStatus] || []
  // Handing over and cancelling are saved as a signed approval (note plus confirmation); the other steps are not.
  const reasonReady = needsApproval ? reason.trim().length >= 8 : true
  return <div className="space-y-4"><label className="block text-sm">Next step<OptionSelect value={selectedStatus} onValueChange={(value) => { setStatus(value); setReason('') }} className="mt-2">{options.map((entry) => <option key={entry} value={entry}>{FULFILLMENT_LABELS[entry] || entry.replaceAll('_', ' ')}</option>)}</OptionSelect></label><div className="grid gap-2"><label className="block text-sm">{needsApproval ? 'Note for the record' : 'Note (optional)'}<Input value={reason} onChange={(event) => setReason(event.target.value)} aria-describedby="fulfillment-note-hint" className="mt-2" /></label>{reasons.length > 0 && <div role="group" aria-label="Common notes" className="flex flex-wrap gap-1.5">{reasons.map((entry) => <button key={entry} type="button" aria-pressed={reason === entry} onClick={() => setReason(entry)} className="rounded-full border border-border bg-background px-3 py-1 text-xs hover:bg-muted aria-pressed:border-foreground aria-pressed:bg-muted">{entry}</button>)}</div>}{needsApproval && !reasonReady && reason.trim().length > 0 && <span id="fulfillment-note-hint" className="text-xs text-muted-foreground">At least 8 characters ({reason.trim().length}/8)</span>}</div>{needsApproval && <label className="flex items-start gap-3 text-sm"><Checkbox checked={attested} onCheckedChange={(checked) => setAttested(checked === true)} className="mt-0.5" /><span>I am making this change myself. My name and this note are saved with the order.</span></label>}<Button id="record-fulfillment-transition" disabled={pending || !selectedStatus || (needsApproval && !attested) || !reasonReady} onClick={() => { if (selectedStatus === 'cancelled') { setConfirmOpen(true); return } submit() }}>{pending ? 'Saving…' : ACTION_LABELS[selectedStatus] || 'Save'}</Button><AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Cancel order {order.orderNumber}?</AlertDialogTitle><AlertDialogDescription>The order closes and cannot be reopened. Refund any payment first.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { setConfirmOpen(false); submit() }}>Confirm</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>{message && <p role="status" className="rounded-[5px] bg-teal-50 p-3 text-sm text-teal-800">{message}</p>}{error && <p role="alert" className="rounded-[5px] bg-red-50 p-3 text-sm text-red-800">{error}</p>}</div>
}
