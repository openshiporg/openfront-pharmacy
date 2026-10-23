'use client'

import { useState, useTransition } from 'react'
import { RxButton as Button } from '@/features/platform/components/rx-ui'
import { Input } from '@/components/ui/input'
import type { PharmacyInventoryLotTaskProjection } from '@/features/pharmacy/contracts'
import { adjustInventoryAction } from '../actions'

export function InventoryTaskActions({ lot }: { lot: PharmacyInventoryLotTaskProjection }) {
  const [targetQuantity, setTargetQuantity] = useState(lot.quantityAvailable)
  const [reason, setReason] = useState('')
  const [attested, setAttested] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function run(task: () => Promise<unknown>, label: string) {
    setMessage(''); setError('')
    startTransition(() => task().then(() => setMessage(`${label} recorded by the server.`)).catch((cause) => setError(cause instanceof Error ? cause.message : `${label} failed`)))
  }
  const ready = reason.trim().length >= 3 && attested
  return <div className="space-y-5">
    <label className="text-sm">Authorized reason<Input value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2" /></label>
    <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={attested} onChange={(event) => setAttested(event.target.checked)} className="mt-1" />I am the authorized human recording this consequential inventory action.</label>
    <div className="grid gap-3 sm:grid-cols-[10rem_auto] sm:items-end"><label className="text-sm">Target quantity<Input type="number" min={lot.quantityQuarantined} value={targetQuantity} onChange={(event) => setTargetQuantity(Number(event.target.value))} className="mt-2" /></label><Button disabled={pending || !ready || !lot.canAdjust || targetQuantity < lot.quantityQuarantined} onClick={() => run(() => adjustInventoryAction({ lotId: lot.id, targetQuantity, reason, idempotencyKey: `adjust:${crypto.randomUUID()}`, attested }), 'Adjustment')}>Record adjustment</Button></div>
    {message && <p className="rounded-lg bg-teal-50 p-3 text-sm text-teal-800">{message}</p>}
    {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
  </div>
}
