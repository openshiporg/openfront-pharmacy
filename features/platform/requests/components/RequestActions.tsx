'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { Input } from '@/components/ui/input'
import { Callout, Pill, RxButton as Button, Track } from '@/features/platform/components/rx-ui'
import { resolvePrescriptionRequestAction } from '../actions'

const OUTCOMES = [['in_review', 'In review'], ['completed', 'Completed'], ['declined', 'Declined']] as const

export function RequestActions({ requestId, status }: { requestId: string; status: string }) {
  const router = useRouter()
  const [outcome, setOutcome] = useState<(typeof OUTCOMES)[number][0]>(status === 'requested' ? 'in_review' : 'completed')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  if (['completed', 'declined'].includes(status)) return null

  function save() {
    setError('')
    startTransition(async () => {
      const result = await resolvePrescriptionRequestAction({ requestId, status: outcome, note })
      if (!result.success) return setError(result.error)
      setNote('')
      router.refresh()
    })
  }

  return <div className="grid gap-2.5">
    <Track label="Outcome" className="w-fit">
      {OUTCOMES.filter(([value]) => value !== 'in_review' || status === 'requested').map(([value, label]) => <Pill key={value} active={outcome === value} onClick={() => setOutcome(value)}>{label}</Pill>)}
    </Track>
    <div className="flex flex-wrap gap-2">
      <Input aria-label="Note for the customer" value={note} onChange={(event) => setNote(event.target.value)} placeholder={outcome === 'declined' ? 'Reason (shown to the customer)' : 'Note for the customer (optional)'} maxLength={1000} className="h-9 min-w-0 flex-1 basis-56 rounded-[5px]" />
      <Button disabled={pending || (outcome === 'declined' && note.trim().length < 3)} onClick={save}>{pending ? 'Saving…' : 'Save'}</Button>
    </div>
    {error && <Callout tone="danger">{error}</Callout>}
  </div>
}
