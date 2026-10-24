'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Callout, Pill, RxButton as Button, Track } from '@/features/platform/components/rx-ui'
import { recordDrugReferenceReviewAction } from '../../credentials/actions'
import { unwrapAction } from '@/features/platform/lib/action-result'

/** Records the organization's review of a drug reference: marketing status and schedule from a named source. */
export function DrugReviewForm({ drugReferenceId, organizations }: { drugReferenceId: string; organizations: Array<{ id: string; name: string }> }) {
  const router = useRouter()
  const [organizationId, setOrganizationId] = useState(organizations[0]?.id || '')
  const [marketingStatus, setMarketingStatus] = useState<'active' | 'inactive'>('active')
  const [controlledSchedule, setControlledSchedule] = useState<'none' | 'controlled_or_unsupported'>('none')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const value = (name: string) => String(data.get(name) || '').trim()
    setError('')
    startTransition(async () => {
      try {
        await unwrapAction(recordDrugReferenceReviewAction({ organizationId, drugReferenceId, marketingStatus, controlledSchedule, sourceName: value('sourceName'), sourceVersion: value('sourceVersion'), sourceReference: value('sourceReference'), reason: value('reason'), attested: data.get('attested') === 'on' }))
        router.refresh()
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Review could not be recorded')
      }
    })
  }

  if (!organizations.length) return <Callout tone="muted">Organization-wide membership required.</Callout>
  return <form onSubmit={submit} className="grid gap-4">
    {organizations.length > 1 && <Track label="Organization">{organizations.map((entry) => <Pill key={entry.id} active={organizationId === entry.id} onClick={() => setOrganizationId(entry.id)}>{entry.name}</Pill>)}</Track>}
    <div className="flex flex-wrap gap-4">
      <div className="grid gap-1.5"><span className="text-sm font-medium">Marketing status</span><Track label="Marketing status"><Pill active={marketingStatus === 'active'} onClick={() => setMarketingStatus('active')}>Active</Pill><Pill active={marketingStatus === 'inactive'} onClick={() => setMarketingStatus('inactive')}>Inactive</Pill></Track></div>
      <div className="grid gap-1.5"><span className="text-sm font-medium">Schedule</span><Track label="Controlled schedule"><Pill active={controlledSchedule === 'none'} onClick={() => setControlledSchedule('none')}>Not scheduled</Pill><Pill active={controlledSchedule === 'controlled_or_unsupported'} onClick={() => setControlledSchedule('controlled_or_unsupported')}>Controlled</Pill></Track></div>
    </div>
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="grid gap-1.5"><Label htmlFor="drug-source">Source</Label><Input id="drug-source" name="sourceName" placeholder="FDA NDC Directory" required /></div>
      <div className="grid gap-1.5"><Label htmlFor="drug-version">Source version</Label><Input id="drug-version" name="sourceVersion" required /></div>
      <div className="grid gap-1.5"><Label htmlFor="drug-ref">Source reference</Label><Input id="drug-ref" name="sourceReference" required /></div>
    </div>
    <div className="grid gap-1.5"><Label htmlFor="drug-reason">Reason</Label><Input id="drug-reason" name="reason" minLength={3} required /></div>
    <label className="flex items-start gap-2.5 text-sm"><input type="checkbox" name="attested" required className="mt-0.5 size-4" />I reviewed this drug reference against the named source.</label>
    {error && <Callout tone="danger">{error}</Callout>}
    <Button type="submit" disabled={pending} className="w-fit">{pending ? 'Recording…' : 'Record review'}</Button>
  </form>
}
