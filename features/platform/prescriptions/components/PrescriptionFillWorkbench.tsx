'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
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
    startTransition(() => selected.run().then(result => { intent.current = null; if (result.status === 'configured') onPolicyRecorded?.(); setMessage(`Recorded: ${result.status}. No inventory was restocked by a release.`); router.refresh() }).catch(cause => setError(cause instanceof Error ? cause.message : 'Unable to record transition')))
  }
  const fills = [...workbench.fills, ...extraPages.flatMap(page => page.fills)]
  const lastPage = extraPages.at(-1) || workbench
  return <section className="space-y-4" aria-label="Fill entitlement workbench">
    <p className="text-sm text-muted-foreground">Each fill owns a quantity reservation and one original-fill or refill entitlement. Approval does not spend a refill. First recorded handoff consumes it once; releasing a partial fill never restores consumed authority or returned stock. The operator must separately admit clinical/legal policy.</p>
    <label className="block text-sm">Transition rationale<Input value={reason} onChange={e => setReason(e.target.value)} className="mt-1" /></label>
    <label className="flex gap-2 text-sm"><input type="checkbox" checked={attested} onChange={e => setAttested(e.target.checked)} />I am the authorized pharmacist and reviewed the applicable evidence.</label>
    {workbench.canConfigure && <details className="rounded-lg border p-4"><summary className="cursor-pointer font-semibold">Record non-retroactive fill policy</summary><p className="my-3 text-sm">No default clinical permission is selected. Existing reservations retain their policy snapshot. Consumption is at first recorded dispense; cancellation after a partial closes unused quantity without refunding the refill.</p><div className="grid gap-3 sm:grid-cols-2"><label>Policy version<Input value={version} onChange={e => setVersion(e.target.value)} /></label><label>Reviewed policy/source reference<Input value={reference} onChange={e => setReference(e.target.value)} /></label><label>Reservation lifetime (minutes)<Input type="number" min={1} value={minutes} onChange={e => setMinutes(e.target.value)} /></label><label>Partial-fill permission<select value={partial} onChange={e => setPartial(e.target.value)} className="block w-full rounded border bg-background p-2"><option value="">Select reviewed policy</option><option value="no">Complete fill only</option><option value="yes">Permit evidenced partial handoffs</option></select></label></div><fieldset className="my-3"><legend className="text-sm">Admitted release reasons</legend>{['cancelled', 'no_pickup', 'expired'].map(cause => <label key={cause} className="mr-4 inline-flex gap-2 text-sm"><input type="checkbox" checked={releaseReasons.includes(cause)} onChange={e => setReleaseReasons(current => e.target.checked ? [...current, cause] : current.filter(v => v !== cause))} />{cause.replaceAll('_', ' ')}</label>)}</fieldset><Button disabled={pending || !ready || !version.trim() || !reference.trim() || !Number.isInteger(Number(minutes)) || Number(minutes) < 1 || !partial || !releaseReasons.length} onClick={() => {
      const input = { prescriptionId, organizationId: workbench.organizationId, policy: { version, reference, consumeOn: 'first_dispense', allowPartial: partial === 'yes', reservationMinutes: Number(minutes), releaseReasons }, idempotencyKey: crypto.randomUUID(), reason, attested }
      run('policy', () => recordFillPolicyAction(input))
    }}>Record reviewed policy</Button></details>}
    {!setupOnly && <>
    {!workbench.policyConfigured && <p role="status" className="rounded border p-3 text-sm">Fill policy is not configured. An organization-wide credentialed operator must record its reviewed version. This does not fabricate prescriber or clinical authorization.</p>}
    {workbench.items.map(item => <div key={item.id} className="rounded-lg border p-3 text-sm">{item.lineage === 'legacy' ? <p>Legacy item: counters and original evidence are preserved. Refill approval requires an explicitly reviewed lineage reconciliation; no automatic entitlement is created.</p> : <p>Versioned item · {item.itemVersion.slice(0, 12)}</p>}{item.originalReservable && <Button className="mt-2" disabled={pending || !ready || !workbench.policyConfigured} onClick={() => {
      const input = { prescriptionId, prescriptionItemId: item.id, expectedItemVersion: item.itemVersion, idempotencyKey: crypto.randomUUID(), reason, attested }
      run(`reserve:${item.id}`, () => reserveFillAction(input))
    }}>Reserve original fill</Button>}</div>)}
    {!fills.length && <p className="text-sm text-muted-foreground">No explicit fill lineage recorded. Historical dispense evidence remains in the existing timeline.</p>}
    {fills.map(fill => <article key={fill.id} className="space-y-3 rounded-lg border p-4"><header><h3 className="font-semibold">Fill {fill.fillNumber} · {fill.kind} · {fill.status.replaceAll('_', ' ')}</h3><p className="text-xs text-muted-foreground">Version {fill.version} · credit {fill.creditState} · policy {fill.policyVersion} ({fill.policyReference})</p></header><dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4"><div><dt>Authorized</dt><dd>{fill.authorizedQuantity}</dd></div><div><dt>Dispensed</dt><dd>{fill.quantityDispensed}</dd></div><div><dt>Released unused</dt><dd>{fill.quantityReleased}</dd></div><div><dt>Still reserved</dt><dd>{fill.quantityRemaining}</dd></div></dl><p className="text-xs">Reservation expires {new Date(fill.expiresAt).toLocaleString()} · {fill.allowPartial ? 'Partial handoffs admitted by recorded policy' : 'Complete handoff required'}</p>
      {!['released', 'dispensed'].includes(fill.status) && <div className="flex flex-wrap gap-2">{fill.releaseReasons.map(cause => <Button key={cause} variant="outline" disabled={pending || !ready || (cause === 'expired' && new Date(fill.expiresAt).getTime() > Date.now())} onClick={() => {
        const input = { prescriptionId, fillId: fill.id, expectedVersion: fill.version, cause, idempotencyKey: crypto.randomUUID(), reason, attested }
        run(`release:${fill.id}:${cause}`, () => releaseFillAction(input))
      }}>Release — {cause.replaceAll('_', ' ')}</Button>)}</div>}
      <ol className="space-y-2 border-t pt-3">{(histories[fill.id]?.events || fill.events).map(event => <li key={event.id} className="text-sm"><p>{event.action} · version {event.version} · units {event.quantity}</p><p className="text-xs text-muted-foreground">{event.actorName} · {new Date(event.occurredAt).toLocaleString()} · {event.reason || 'Recorded request'}</p>{event.orderId && <a className="underline" href={`/dashboard/platform/orders/${event.orderId}`}>Read recorded handoff {event.orderNumber || event.orderId}</a>}</li>)}</ol>{(histories[fill.id] ? histories[fill.id].hasMore : fill.hasMoreEvents) && <Button variant="outline" disabled={pending} onClick={() => startTransition(() => loadFillHistoryAction({ prescriptionId, fillId: fill.id, after: histories[fill.id]?.nextCursor }).then(page => setHistories(current => ({ ...current, [fill.id]: { ...page, events: [...(current[fill.id]?.events || []), ...page.events] } }))).catch(cause => setError(cause instanceof Error ? cause.message : 'Unable to load history')))}>Load full event history</Button>}
    </article>)}
    <p className="text-xs">Showing {fills.length} of {workbench.totalCount} scoped fill records.</p>
    {lastPage.hasMore && <Button variant="outline" disabled={pending} onClick={() => startTransition(() => loadFillPageAction({ prescriptionId, after: lastPage.nextCursor }).then(page => setExtraPages(current => [...current, page])).catch(cause => setError(cause instanceof Error ? cause.message : 'Unable to load more fills')))}>Load older fills</Button>}
    </>}
    {intent.current && error && <Button variant="outline" disabled={pending} onClick={() => run(intent.current!.target, intent.current!.run)}>Retry identical pending command</Button>}
    {message && <p role="status" className="text-sm">{message}</p>}{error && <p role="alert" className="text-sm text-red-700">{error}</p>}
  </section>
}
