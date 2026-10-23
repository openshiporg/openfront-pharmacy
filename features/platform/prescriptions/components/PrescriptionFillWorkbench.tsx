'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Callout, Field, Mono, RxButton as Button, TitleLine, humanize, statusTone } from '@/features/platform/components/rx-ui'
import { Input } from '@/components/ui/input'
import type { PharmacyFillWorkbench } from '@/features/pharmacy/fills'
import { loadFillHistoryAction } from '../actions/fillHistory'
import { loadFillPageAction, recordFillPolicyAction, releaseFillAction, reserveFillAction } from '../actions/fills'

export function PrescriptionFillWorkbench({ prescriptionId, workbench, setupOnly = false, onPolicyRecorded }: { prescriptionId: string; workbench: PharmacyFillWorkbench; setupOnly?: boolean; onPolicyRecorded?: () => void }) {
  const router = useRouter()
  const [reason, setReason] = useState(''), [attested, setAttested] = useState(false)
  const [version, setVersion] = useState(''), [reference, setReference] = useState('')
  const [minutes, setMinutes] = useState(''), [partial, setPartial] = useState('')
  const [releaseReasons, setReleaseReasons] = useState<string[]>([])
  const [histories, setHistories] = useState<Record<string, Awaited<ReturnType<typeof loadFillHistoryAction>>>>({})
  const [extraPages, setExtraPages] = useState<PharmacyFillWorkbench[]>([])
  const [error, setError] = useState(''), [message, setMessage] = useState('')
  const [pending, startTransition] = useTransition()
  // Freeze the entire command after an ambiguous response, not only its key.
  const intent = useRef<{ target: string; run: () => Promise<{ status: string }> } | null>(null)
  useEffect(() => { setExtraPages([]); setHistories({}) }, [workbench])
  const ready = attested && reason.trim().length >= 8
  const run = (target: string, command: () => Promise<{ status: string }>) => {
    if (intent.current && intent.current.target !== target) { setError('Resolve the pending command before starting another transition. Refresh reads authoritative history.'); return }
    const selected = intent.current || { target, run: command }
    intent.current = selected
    setError(''); setMessage('')
    startTransition(() => selected.run().then(result => { intent.current = null; if (result.status === 'configured') onPolicyRecorded?.(); setMessage(`Recorded: ${result.status.replaceAll('_', ' ')}.`); router.refresh() }).catch(cause => setError(cause instanceof Error ? cause.message : 'Unable to record transition')))
  }
  const fills = [...workbench.fills, ...extraPages.flatMap(page => page.fills)]
  const lastPage = extraPages.at(-1) || workbench
  return <section className="space-y-4" aria-label="Fill entitlement workbench">
    <div className="grid gap-3 rounded-xl bg-muted/40 p-3.5 ring-1 ring-inset ring-border/60 sm:p-4">
      <label className="grid gap-1.5 text-sm font-medium">Reason<Input value={reason} onChange={e => setReason(e.target.value)} minLength={8} /></label>
      <label className="flex items-start gap-2.5 text-sm"><input type="checkbox" checked={attested} onChange={e => setAttested(e.target.checked)} className="mt-0.5 size-4" />I am the authorized pharmacist and reviewed the applicable evidence.</label>
    </div>
    {workbench.canConfigure && <details className="rounded-xl p-4 ring-1 ring-border"><summary className="cursor-pointer text-sm font-semibold">Fill policy</summary><div className="mt-3 grid gap-3 text-sm sm:grid-cols-2"><label>Policy version<Input value={version} onChange={e => setVersion(e.target.value)} /></label><label>Reviewed policy/source reference<Input value={reference} onChange={e => setReference(e.target.value)} /></label><label>Reservation lifetime (minutes)<Input type="number" min={1} value={minutes} onChange={e => setMinutes(e.target.value)} /></label><label>Partial-fill permission<select value={partial} onChange={e => setPartial(e.target.value)} className="block w-full rounded-lg border bg-background px-3 py-2"><option value="">Select reviewed policy</option><option value="no">Complete fill only</option><option value="yes">Permit evidenced partial handoffs</option></select></label></div><fieldset className="my-3"><legend className="text-sm">Admitted release reasons</legend>{['cancelled', 'no_pickup', 'expired'].map(cause => <label key={cause} className="mr-4 inline-flex gap-2 text-sm"><input type="checkbox" checked={releaseReasons.includes(cause)} onChange={e => setReleaseReasons(current => e.target.checked ? [...current, cause] : current.filter(v => v !== cause))} />{cause.replaceAll('_', ' ')}</label>)}</fieldset><Button disabled={pending || !ready || !version.trim() || !reference.trim() || !Number.isInteger(Number(minutes)) || Number(minutes) < 1 || !partial || !releaseReasons.length} onClick={() => {
      const input = { prescriptionId, organizationId: workbench.organizationId, policy: { version, reference, consumeOn: 'first_dispense', allowPartial: partial === 'yes', reservationMinutes: Number(minutes), releaseReasons }, idempotencyKey: crypto.randomUUID(), reason, attested }
      run('policy', () => recordFillPolicyAction(input))
    }}>Record reviewed policy</Button></details>}
    {!setupOnly && <>
    {!workbench.policyConfigured && <Callout tone="warn" title="Fill policy not configured">An organization-wide credentialed operator must record the reviewed policy.</Callout>}
    {workbench.items.map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm ring-1 ring-border">{item.lineage === 'legacy' ? <TitleLine as="h3" titleClassName="text-sm" title="Legacy item" tone="warn" state="Lineage reconciliation required" /> : <TitleLine as="h3" titleClassName="text-sm" title="Item" state={<Mono>{item.itemVersion.slice(0, 12)}</Mono>} />}{item.originalReservable && <Button disabled={pending || !ready || !workbench.policyConfigured} onClick={() => {
      const input = { prescriptionId, prescriptionItemId: item.id, expectedItemVersion: item.itemVersion, idempotencyKey: crypto.randomUUID(), reason, attested }
      run(`reserve:${item.id}`, () => reserveFillAction(input))
    }}>Reserve original fill</Button>}</div>)}
    {!fills.length && <p className="text-sm text-muted-foreground">No fills recorded.</p>}
    {fills.map(fill => <article key={fill.id} className="space-y-3 rounded-xl p-4 ring-1 ring-border"><header><TitleLine as="h3" title={`Fill ${fill.fillNumber} · ${humanize(fill.kind)}`} tone={statusTone(fill.status)} state={humanize(fill.status)} /><p className="mt-0.5 font-mono text-[11px] text-muted-foreground">v{fill.version} · credit {humanize(fill.creditState)} · policy {fill.policyVersion} ({fill.policyReference})</p></header><dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4"><Field label="Authorized"><Mono>{fill.authorizedQuantity}</Mono></Field><Field label="Dispensed"><Mono>{fill.quantityDispensed}</Mono></Field><Field label="Released"><Mono>{fill.quantityReleased}</Mono></Field><Field label="Reserved"><Mono>{fill.quantityRemaining}</Mono></Field></dl><p className="font-mono text-[11px] text-muted-foreground">Expires {new Date(fill.expiresAt).toLocaleString()} · {fill.allowPartial ? 'Partial handoffs allowed' : 'Complete handoff required'}</p>
      {!['released', 'dispensed'].includes(fill.status) && <div className="flex flex-wrap gap-2">{fill.releaseReasons.map(cause => <Button key={cause} variant="outline" disabled={pending || !ready || (cause === 'expired' && new Date(fill.expiresAt).getTime() > Date.now())} onClick={() => {
        const input = { prescriptionId, fillId: fill.id, expectedVersion: fill.version, cause, idempotencyKey: crypto.randomUUID(), reason, attested }
        run(`release:${fill.id}:${cause}`, () => releaseFillAction(input))
      }}>Release — {cause.replaceAll('_', ' ')}</Button>)}</div>}
      <ol className="space-y-2 border-t border-dashed pt-3">{(histories[fill.id]?.events || fill.events).map(event => <li key={event.id} className="text-sm"><p className="font-medium capitalize">{humanize(event.action)} <Mono className="text-xs font-normal text-muted-foreground">v{event.version} · {event.quantity} units</Mono></p><p className="font-mono text-[11px] text-muted-foreground">{event.actorName} · {new Date(event.occurredAt).toLocaleString()} · {event.reason || 'Recorded request'}</p>{event.orderId && <a className="text-sm font-medium underline underline-offset-4" href={`/dashboard/platform/orders/${event.orderId}`}>Handoff {event.orderNumber || event.orderId}</a>}</li>)}</ol>{(histories[fill.id] ? histories[fill.id].hasMore : fill.hasMoreEvents) && <Button variant="outline" disabled={pending} onClick={() => startTransition(() => loadFillHistoryAction({ prescriptionId, fillId: fill.id, after: histories[fill.id]?.nextCursor }).then(page => setHistories(current => ({ ...current, [fill.id]: { ...page, events: [...(current[fill.id]?.events || []), ...page.events] } }))).catch(cause => setError(cause instanceof Error ? cause.message : 'Unable to load history')))}>Full history</Button>}
    </article>)}
    <p className="font-mono text-[11px] tabular-nums text-muted-foreground">{fills.length} of {workbench.totalCount}</p>
    {lastPage.hasMore && <Button variant="outline" disabled={pending} onClick={() => startTransition(() => loadFillPageAction({ prescriptionId, after: lastPage.nextCursor }).then(page => setExtraPages(current => [...current, page])).catch(cause => setError(cause instanceof Error ? cause.message : 'Unable to load more fills')))}>Load older fills</Button>}
    </>}
    {intent.current && error && <Button variant="outline" disabled={pending} onClick={() => run(intent.current!.target, intent.current!.run)}>Retry pending command</Button>}
    {message && <Callout tone="muted">{message}</Callout>}{error && <Callout tone="danger">{error}</Callout>}
  </section>
}
