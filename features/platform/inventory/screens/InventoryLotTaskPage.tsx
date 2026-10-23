import Link from 'next/link'
import { keystoneClient } from '@/features/dashboard/lib/keystoneClient'
import type { PharmacyInventoryLotTaskProjection } from '@/features/pharmacy/contracts'
import { TaskPage, TaskSection } from '@/features/platform/components/TaskPage'
import { Dot, Field, Mono, TitleLine, humanize, statusTone } from '@/features/platform/components/rx-ui'
import { InventoryTaskActions } from '../components/InventoryTaskActions'

export async function InventoryLotTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: lotId } = await params
  const response = await keystoneClient<{ pharmacyInventoryLotTask: PharmacyInventoryLotTaskProjection }>(`query Task($lotId: ID!) { pharmacyInventoryLotTask(lotId: $lotId) { id lotNumber serialNumber status expirationDate receivedAt quantityReceived quantityAvailable quantityQuarantined eligibleQuantity storageBin coldChainRequired minimumTemperatureC maximumTemperatureC coldChainEvidenceComplete productId productTitle productSku locationId locationName canAdjust recalls { id recallNumber status classification } excursions { id status observedMinimumC observedMaximumC startedAt endedAt } movements { id movementType quantityDelta reason occurredAt actorName } } }`, { lotId })
  if (!response.success) return <TaskPage parent={{ label: 'Inventory', href: '/platform/inventory' }} title="Lot unavailable" description={response.error} />
  const lot = response.data.pharmacyInventoryLotTask
  const expires = new Date(lot.expirationDate)
  return <TaskPage parent={{ label: 'Inventory', href: '/platform/inventory' }} meta={`Lot ${lot.lotNumber}`} title={lot.productTitle} state={humanize(lot.status)} tone={statusTone(lot.status)} description={`${lot.productSku} · ${lot.locationName}${lot.storageBin ? ` · Bin ${lot.storageBin}` : ''}`}>
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-border ring-1 ring-border sm:grid-cols-4">
      {[['Received', lot.quantityReceived], ['Available', lot.quantityAvailable], ['Quarantined', lot.quantityQuarantined], ['Eligible', lot.eligibleQuantity]].map(([label, value]) => <div key={label} className="bg-background px-4 py-3"><dt className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">{label}</dt><dd className="mt-1 font-mono text-xl tabular-nums">{value}</dd></div>)}
    </dl>
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl bg-muted/40 px-4 py-4 ring-1 ring-inset ring-border/60 sm:grid-cols-4 sm:px-5">
      <Field label="Expires">{expires.toLocaleDateString()}</Field>
      <Field label="Received">{lot.receivedAt ? new Date(lot.receivedAt).toLocaleDateString() : 'Not reported'}</Field>
      <Field label="Serial">{lot.serialNumber ? <Mono>{lot.serialNumber}</Mono> : 'None'}</Field>
      <Field label="Cold chain">{lot.coldChainRequired ? <span className="inline-flex items-baseline gap-1.5"><Dot tone={lot.coldChainEvidenceComplete ? 'ok' : 'danger'} />{lot.minimumTemperatureC ?? '—'}° to {lot.maximumTemperatureC ?? '—'}°C</span> : 'Not required'}</Field>
    </dl>
    <div className="grid gap-5 md:grid-cols-2">
      <TaskSection title="Recalls" count={lot.recalls.length}>{lot.recalls.length ? <ul className="divide-y">{lot.recalls.map((recall) => <li key={recall.id} className="py-2.5 first:pt-0 last:pb-0"><TitleLine as="h3" titleClassName="text-sm" title={<Link href={`/dashboard/platform/recalls/${recall.id}`} className="font-mono hover:underline hover:underline-offset-4">{recall.recallNumber}</Link>} tone={statusTone(recall.status)} state={humanize(recall.status)} /><p className="mt-0.5 text-xs capitalize text-muted-foreground">{humanize(recall.classification)}</p></li>)}</ul> : <p className="text-sm text-muted-foreground">No linked recalls.</p>}</TaskSection>
      <TaskSection title="Temperature excursions" count={lot.excursions.length}>{lot.excursions.length ? <ul className="divide-y">{lot.excursions.map((excursion) => <li key={excursion.id} className="py-2.5 text-sm first:pt-0 last:pb-0"><TitleLine as="h3" titleClassName="text-sm" title={<Mono>{excursion.observedMinimumC}° to {excursion.observedMaximumC}°C</Mono>} tone={statusTone(excursion.status)} state={humanize(excursion.status)} /><p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{new Date(excursion.startedAt).toLocaleString()}</p></li>)}</ul> : <p className="text-sm text-muted-foreground">No excursions.</p>}</TaskSection>
    </div>
    <TaskSection title="Actions"><InventoryTaskActions lot={lot} /></TaskSection>
    <TaskSection title="Movements" count={lot.movements.length}>{lot.movements.length ? <ul className="divide-y">{lot.movements.map((movement) => <li key={movement.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 py-2.5 text-sm first:pt-0 last:pb-0"><span className="min-w-0"><span className="font-semibold capitalize">{humanize(movement.movementType)}</span><span className="block text-muted-foreground">{movement.reason}</span><span className="block font-mono text-[11px] text-muted-foreground">{movement.actorName} · {new Date(movement.occurredAt).toLocaleString()}</span></span><Mono className={movement.quantityDelta < 0 ? 'text-red-700 dark:text-red-300' : 'text-emerald-700 dark:text-emerald-300'}>{movement.quantityDelta > 0 ? '+' : ''}{movement.quantityDelta}</Mono></li>)}</ul> : <p className="text-sm text-muted-foreground">No movements recorded.</p>}</TaskSection>
  </TaskPage>
}
