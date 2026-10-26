'use client'

import { useState, useTransition } from 'react'
import { RxButton as Button } from '@/features/platform/components/rx-ui'
import { Input } from '@/components/ui/input'
import type { PharmacyRecallTaskProjection } from '@/features/pharmacy/contracts'
import { closeRecallAction, disposeRecallLotAction, quarantineRecallAction, recordRecallExposureAction } from '../actions'
import { unwrapAction } from '@/features/platform/lib/action-result'

export function RecallTaskActions({ recall }: { recall: PharmacyRecallTaskProjection }) {
  const [reason, setReason] = useState('')
  const [attested, setAttested] = useState(false)
  const [contactMethod, setContactMethod] = useState('phone')
  const [outcome, setOutcome] = useState('')
  const [notes, setNotes] = useState('')
  const [exposureStatus, setExposureStatus] = useState('contacted')
  const [dispositionReference, setDispositionReference] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const ready = attested && reason.trim().length >= 8
  const run = (task: () => Promise<any>, success: (result: any) => string) => { setMessage(''); setError(''); startTransition(() => task().then((result) => setMessage(success(result))).catch((cause) => setError(cause instanceof Error ? cause.message : 'Recall action failed'))) }
  const openExposures = recall.exposures.filter((entry) => !['returned', 'resolved', 'unable_to_reach'].includes(entry.status))
  const quarantinedLots = recall.lots.filter((entry) => entry.quantityQuarantined > 0)
  return <div className="space-y-6">
    <label className="text-sm">Action reason<Input value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2" /></label><label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={attested} onChange={(event) => setAttested(event.target.checked)} className="mt-1" />I am the authorized human recording the physical disposition or patient outreach evidence shown here. The software does not infer contact, return, destruction, custody, or clinical outcome.</label>
    {recall.canQuarantine && <Button disabled={pending || !ready} onClick={() => run(() => unwrapAction(quarantineRecallAction({ recallId: recall.id, reason, attested })), (result) => `${result.lotCount} lot(s) quarantined.`)}>Quarantine affected lots</Button>}
    {openExposures.length > 0 && <section className="space-y-3 rounded-[6px] p-4 border border-border"><div><h3 className="font-semibold">Dispensed exposure outreach</h3><p className="mt-1 text-xs text-muted-foreground">Resolve every exposure before recall closure.</p></div><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Contact method<Input value={contactMethod} onChange={(event) => setContactMethod(event.target.value)} className="mt-2" /></label><label className="text-sm">Recorded status<select value={exposureStatus} onChange={(event) => setExposureStatus(event.target.value)} className="mt-2 block w-full rounded-[5px] border bg-background px-3 py-2"><option value="contacted">Contacted, follow-up pending</option><option value="returned">Return physically recorded</option><option value="resolved">Resolved without return</option><option value="unable_to_reach">Unable to reach, procedure exhausted</option></select></label><label className="text-sm sm:col-span-2">Outcome<Input value={outcome} onChange={(event) => setOutcome(event.target.value)} className="mt-2" /></label><label className="text-sm sm:col-span-2">Notes<Input value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-2" /></label></div>{openExposures.map((exposure) => <div key={exposure.id} className="flex flex-col gap-3 rounded-[5px] bg-muted/50 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{exposure.patientDisplayName} · {exposure.quantityDispensed} dispensed</p><p className="text-muted-foreground">{exposure.prescriptionNumber || 'Prescription'} · {exposure.orderNumber || 'Order not linked'} · {exposure.status.replaceAll('_', ' ')}</p></div><Button disabled={pending || !ready || !contactMethod.trim() || !outcome.trim()} onClick={() => run(() => unwrapAction(recordRecallExposureAction({ recallId: recall.id, exposureId: exposure.id, status: exposureStatus, contactMethod, outcome, notes: notes || undefined, reason, attested })), (result) => `Exposure recorded as ${result.status.replaceAll('_', ' ')}.`)}>Record outreach</Button></div>)}</section>}
    {quarantinedLots.length > 0 && <section className="space-y-3 rounded-[6px] p-4 border border-border"><div><h3 className="font-semibold">Physical lot disposition</h3><p className="mt-1 text-xs text-muted-foreground">Record the disposition of every quarantined unit.</p></div><label className="text-sm">Disposition reference<Input value={dispositionReference} onChange={(event) => setDispositionReference(event.target.value)} placeholder="Destruction vendor, witnessed disposition, or other physical record" className="mt-2" /></label>{quarantinedLots.map((lot) => <div key={lot.id} className="flex flex-col gap-3 rounded-[5px] bg-muted/50 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"><p><strong>{lot.productTitle}</strong> · {lot.lotNumber} · {lot.quantityQuarantined} quarantined</p><Button variant="destructive" disabled={pending || !ready || !dispositionReference.trim()} onClick={() => run(() => unwrapAction(disposeRecallLotAction({ recallId: recall.id, lotId: lot.id, quantity: lot.quantityQuarantined, dispositionReference, idempotencyKey: crypto.randomUUID(), reason, attested })), () => `Lot ${lot.lotNumber} disposition recorded.`)}>Record complete disposition</Button></div>)}</section>}
    {recall.canClose && <Button variant="destructive" disabled={pending || !ready} onClick={() => run(() => unwrapAction(closeRecallAction({ recallId: recall.id, reason, attested })), (result) => `Recall ${result.status}.`)}>Close recall</Button>}
    {!recall.canQuarantine && !openExposures.length && !quarantinedLots.length && !recall.canClose && <p className="text-sm text-muted-foreground">No actions available.</p>}
    {message && <p className="rounded-[5px] bg-teal-50 p-3 text-sm text-teal-800">{message}</p>}{error && <p className="rounded-[5px] bg-red-50 p-3 text-sm text-red-800">{error}</p>}
  </div>
}
