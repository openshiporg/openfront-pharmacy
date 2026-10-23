'use client'

import { useState, useTransition } from 'react'
import { RxButton as Button } from '@/features/platform/components/rx-ui'
import { Input } from '@/components/ui/input'
import type { PharmacyOrderTaskProjection } from '@/features/pharmacy/contracts'
import { currentFulfillmentSelection } from './fulfillmentSelection'
import { transitionFulfillmentAction } from '../actions'

export function FulfillmentTaskActions({ order }: { order: PharmacyOrderTaskProjection }) {
  const options = order.availableFulfillmentStatuses
  const [status, setStatus] = useState(options[0] || '')
  const selectedStatus = currentFulfillmentSelection(options, status)
  const [reason, setReason] = useState('')
  const [attested, setAttested] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  if (!order.fulfillment) return <p className="text-sm text-muted-foreground">No fulfillment record is available.</p>
  if (!options.length) return <p className="text-sm text-muted-foreground">Fulfillment complete ({order.fulfillment.status.replaceAll('_', ' ')}).</p>
  return <div className="space-y-4"><label className="text-sm">Next status<select value={selectedStatus} onChange={(event) => setStatus(event.target.value)} className="mt-2 block w-full rounded-lg border bg-background px-3 py-2">{options.map((entry) => <option key={entry} value={entry}>{entry.replaceAll('_', ' ')}</option>)}</select></label><label className="text-sm">Operational reason<Input value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2" /></label><label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={attested} onChange={(event) => setAttested(event.target.checked)} className="mt-1" />I am the authorized human recording this fulfillment transition. Handoff and cancellation create explicit approval evidence.</label><Button id="record-fulfillment-transition" disabled={pending || !selectedStatus || !attested || reason.trim().length < 3} onClick={() => { setMessage(''); setError(''); startTransition(() => transitionFulfillmentAction({ fulfillmentId: order.fulfillment!.id, orderId: order.id, status: selectedStatus, reason, attested }).then((result) => { setMessage(`Fulfillment advanced to server status ${result.status}.`); setAttested(false); setReason('') }).catch((cause) => setError(cause instanceof Error ? cause.message : 'Transition failed'))) }}>Record transition</Button>{message && <p role="status" className="rounded-lg bg-teal-50 p-3 text-sm text-teal-800">{message}</p>}{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}</div>
}
