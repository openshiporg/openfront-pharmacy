'use client'

import { useRef, useState, useTransition } from 'react'
import { RxButton as Button } from '@/features/platform/components/rx-ui'
import { Input } from '@/components/ui/input'
import type { PharmacyOrderTaskProjection } from '@/features/pharmacy/contracts'
import { refundCashPaymentAction, refundPaymentAction } from '../actions'
import { unwrapAction } from '@/features/platform/lib/action-result'

export function PaymentTaskActions({ order }: { order: PharmacyOrderTaskProjection }) {
  const [reason, setReason] = useState('')
  const [attested, setAttested] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const cashRefundKey = useRef<string | null>(null)
  if (!order.payment) return <p className="text-sm text-muted-foreground">No payment record.</p>
  if (order.payment.status !== 'captured') return <p className="text-sm capitalize">{order.payment.providerName} · {order.payment.status}</p>
  const refund = order.payment.tenderMethod === 'cash'
    ? () => unwrapAction(refundCashPaymentAction({ paymentId: order.payment!.id, orderId: order.id, cashReturnedAmount: order.payment!.amount, idempotencyKey: cashRefundKey.current || (cashRefundKey.current = crypto.randomUUID()), reason, attested }))
    : () => unwrapAction(refundPaymentAction({ paymentId: order.payment!.id, orderId: order.id, reason, attested }))
  return <div className="space-y-4"><p className="text-sm">{order.payment.providerName} · captured</p>{order.payment.tenderMethod === 'cash' && <p className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">Records a full cash refund. Medication is not restocked.</p>}<label className="text-sm">Refund reason<Input value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2" /></label><label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={attested} onChange={(event) => setAttested(event.target.checked)} className="mt-1" />I confirm this full-payment refund.</label><Button variant="destructive" disabled={pending || !attested || reason.trim().length < 8} onClick={() => { setMessage(''); setError(''); startTransition(() => refund().then((result) => { cashRefundKey.current = null; setMessage(`Payment ${result.status}.`) }).catch((cause) => setError(cause instanceof Error ? cause.message : 'Refund failed'))) }}>{pending ? 'Refunding…' : 'Issue full refund'}</Button>{message && <p className="rounded-lg bg-teal-50 p-3 text-sm text-teal-800">{message}</p>}{error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}</div>
}
