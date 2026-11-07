'use client'

import { useRef, useState, useTransition } from 'react'
import { RxButton as Button } from '@/features/platform/components/rx-ui'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PlatformDateTimeInput } from '@/features/platform/components/PlatformDateTime'
import { unwrapAction } from '@/features/platform/lib/action-result'
import type { PharmacyInventoryLotTaskProjection } from '@/features/pharmacy/contracts'
import { recordExcursionAction, resolveExcursionAction } from '../actions'

type Excursion = PharmacyInventoryLotTaskProjection['excursions'][number]

function Feedback({ message, error }: { message: string; error: string }) {
  return <>
    {message && <p role="status" className="rounded-[5px] bg-teal-50 p-3 text-sm text-teal-800 dark:bg-teal-950/40 dark:text-teal-200">{message}</p>}
    {error && <p role="alert" className="rounded-[5px] bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">{error}</p>}
  </>
}

/** Pharmacist disposition of one open excursion: release the held stock or write the lot off. */
export function ResolveExcursion({ lotId, excursion }: { lotId: string; excursion: Excursion }) {
  const [open, setOpen] = useState(false)
  const [disposition, setDisposition] = useState<'released' | 'destroyed'>('released')
  const [note, setNote] = useState('')
  const [attested, setAttested] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const key = useRef<string | null>(null)

  if (!['open', 'under_review'].includes(excursion.status)) return null
  if (!open) return <Button size="sm" variant="outline" className="mt-2" onClick={() => setOpen(true)}>Resolve</Button>

  function submit() {
    setMessage(''); setError('')
    key.current ||= `excursion-disposition:${crypto.randomUUID()}`
    startTransition(() => unwrapAction(resolveExcursionAction({ lotId, excursionId: excursion.id, disposition, note, idempotencyKey: key.current!, attested }))
      .then((result) => { key.current = null; setMessage(result.status === 'destroyed' ? 'Lot written off and the excursion closed.' : `Excursion closed; lot is ${String(result.lotStatus).replace(/_/g, ' ')}.`) })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Resolution failed')))
  }
  return <div className="mt-3 space-y-3 rounded-[6px] border border-border p-3">
    <fieldset className="space-y-2 text-sm">
      <legend className="font-medium">Disposition</legend>
      <label className="flex items-start gap-2"><input type="radio" name={`disposition-${excursion.id}`} checked={disposition === 'released'} onChange={() => setDisposition('released')} className="mt-1" /><span>Release to stock<span className="block text-xs text-muted-foreground">Stability data supports the exposure. Not allowed for a recalled or expired lot.</span></span></label>
      <label className="flex items-start gap-2"><input type="radio" name={`disposition-${excursion.id}`} checked={disposition === 'destroyed'} onChange={() => setDisposition('destroyed')} className="mt-1" /><span>Destroy and write off<span className="block text-xs text-muted-foreground">The whole lot is written off and becomes depleted.</span></span></label>
    </fieldset>
    <label className="block text-sm">Pharmacist note<Textarea value={note} onChange={(event) => setNote(event.target.value)} className="mt-2" rows={3} placeholder="What the data logger and manufacturer stability data showed" /></label>
    <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={attested} onChange={(event) => setAttested(event.target.checked)} className="mt-1" />I am the pharmacist recording this disposition.</label>
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant={disposition === 'destroyed' ? 'destructive' : 'default'} disabled={pending || note.trim().length < 8 || !attested} onClick={submit}>{disposition === 'destroyed' ? 'Write off lot' : 'Release lot'}</Button>
      <Button size="sm" variant="ghost" disabled={pending} onClick={() => setOpen(false)}>Cancel</Button>
    </div>
    <Feedback message={message} error={error} />
  </div>
}

/** Logs a temperature excursion on a cold-chain lot, which quarantines its stock until a pharmacist resolves it. */
export function RecordExcursion({ lot }: { lot: PharmacyInventoryLotTaskProjection }) {
  const [minimum, setMinimum] = useState('')
  const [maximum, setMaximum] = useState('')
  const [startedAt, setStartedAt] = useState('')
  const [endedAt, setEndedAt] = useState('')
  const [reason, setReason] = useState('')
  const [attested, setAttested] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const key = useRef<string | null>(null)
  if (!lot.coldChainRequired || !['available', 'quarantined'].includes(lot.status)) return null

  const ready = minimum.trim() !== '' && maximum.trim() !== '' && Number(minimum) <= Number(maximum) && startedAt && reason.trim().length >= 8 && attested
  function submit() {
    setMessage(''); setError('')
    key.current ||= `excursion:${crypto.randomUUID()}`
    startTransition(() => unwrapAction(recordExcursionAction({
      lotId: lot.id,
      observedMinimumC: Number(minimum),
      observedMaximumC: Number(maximum),
      startedAt: new Date(startedAt).toISOString(),
      endedAt: endedAt ? new Date(endedAt).toISOString() : undefined,
      reason, idempotencyKey: key.current!, attested,
    })).then(() => { key.current = null; setMessage('Excursion logged; the lot is quarantined until it is resolved.') })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Excursion could not be logged')))
  }
  return <details className="rounded-[6px] border border-border p-3">
    <summary className="cursor-pointer text-sm font-medium">Log temperature excursion</summary>
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      <label className="text-sm">Lowest reading (°C)<Input type="number" step="0.1" value={minimum} onChange={(event) => setMinimum(event.target.value)} className="mt-2" /></label>
      <label className="text-sm">Highest reading (°C)<Input type="number" step="0.1" value={maximum} onChange={(event) => setMaximum(event.target.value)} className="mt-2" /></label>
      <label className="text-sm">Started<PlatformDateTimeInput value={startedAt} onChange={setStartedAt} className="mt-2" aria-label="Excursion started" /></label>
      <label className="text-sm">Ended (optional)<PlatformDateTimeInput value={endedAt} onChange={setEndedAt} className="mt-2" aria-label="Excursion ended" /></label>
      <label className="text-sm sm:col-span-2">What happened<Input value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2" /></label>
      <label className="flex items-start gap-3 text-sm sm:col-span-2"><input type="checkbox" checked={attested} onChange={(event) => setAttested(event.target.checked)} className="mt-1" />I am the authorized human logging this excursion.</label>
      <div className="sm:col-span-2"><Button disabled={pending || !ready} onClick={submit}>Log excursion and quarantine lot</Button></div>
      <div className="sm:col-span-2 space-y-2"><Feedback message={message} error={error} /></div>
    </div>
  </details>
}
