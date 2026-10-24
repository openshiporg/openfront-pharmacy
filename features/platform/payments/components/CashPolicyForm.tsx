'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Callout, RxButton as Button } from '@/features/platform/components/rx-ui'
import { recordCashPolicy } from '../actions'

export function CashPolicyForm({ organizationId, taxRateBps }: { organizationId: string; taxRateBps: number }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const percent = Number(data.get('taxRate'))
    setError('')
    startTransition(async () => {
      const result = await recordCashPolicy({ organizationId, taxRateBps: Math.round(percent * 100), policyReference: String(data.get('policyReference') || '').trim(), reason: String(data.get('reason') || '').trim(), attested: data.get('attested') === 'on' })
      if (!result.success) return setError(result.error)
      toast.success('Cash policy recorded')
      router.refresh()
    })
  }

  return <form onSubmit={submit} className="grid gap-3">
    <div className="grid gap-3 sm:grid-cols-[8rem_minmax(0,1fr)]">
      <div className="grid gap-1.5"><Label htmlFor="cash-tax">Tax rate %</Label><Input id="cash-tax" name="taxRate" type="number" step="0.01" min={0} max={100} defaultValue={(taxRateBps / 100).toFixed(2)} required className="font-mono tabular-nums" /></div>
      <div className="grid gap-1.5"><Label htmlFor="cash-ref">Tax policy reference</Label><Input id="cash-ref" name="policyReference" required /></div>
    </div>
    <div className="grid gap-1.5"><Label htmlFor="cash-reason">Reason</Label><Input id="cash-reason" name="reason" minLength={3} required /></div>
    <label className="flex items-start gap-2.5 text-sm"><input type="checkbox" name="attested" required className="mt-0.5 size-4" />I reviewed this cash and sales-tax policy for the pharmacy.</label>
    {error && <Callout tone="danger">{error}</Callout>}
    <Button type="submit" disabled={pending} className="w-fit">{pending ? 'Recording…' : 'Record policy'}</Button>
  </form>
}
