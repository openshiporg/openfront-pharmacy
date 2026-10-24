'use client'

import { useRef, useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Callout, RxButton as Button } from '@/features/platform/components/rx-ui'
import { requestTransferOutAction } from '../actions'
import { unwrapAction } from '@/features/platform/lib/action-result'

/** Starts an outbound transfer to another pharmacy with the patient's recorded consent. */
export function TransferOutForm({ prescriptionId, patientId }: { prescriptionId: string; patientId: string }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const key = useRef<string | null>(null)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    key.current ||= `transfer-out:${prescriptionId}:${crypto.randomUUID()}`
    setError('')
    startTransition(async () => {
      const result = await unwrapAction(requestTransferOutAction({ prescriptionId, patientId, counterpartyName: String(data.get('counterpartyName') || '').trim(), counterpartyPhone: String(data.get('counterpartyPhone') || '').trim(), consentAccepted: data.get('consent') === 'on', idempotencyKey: key.current! }))
      if (!result.success) return setError(result.error)
      key.current = null
      form.reset()
      toast.success('Transfer requested')
      router.refresh()
    })
  }

  return <form onSubmit={submit} className="grid gap-3">
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="grid gap-1.5"><Label htmlFor="to-pharmacy">Receiving pharmacy</Label><Input id="to-pharmacy" name="counterpartyName" maxLength={200} required /></div>
      <div className="grid gap-1.5"><Label htmlFor="to-phone">Its phone</Label><Input id="to-phone" name="counterpartyPhone" type="tel" maxLength={40} /></div>
    </div>
    <label className="flex items-start gap-2.5 text-sm"><input type="checkbox" name="consent" required className="mt-0.5 size-4" />The patient consented to this transfer.</label>
    {error && <Callout tone="danger">{error}</Callout>}
    <Button type="submit" variant="outline" disabled={pending} className="w-fit">{pending ? 'Requesting…' : 'Request transfer out'}</Button>
  </form>
}
