import Link from 'next/link'
import { platformRequest } from '@/features/platform/lib/request'
import type { PharmacyRecallTaskProjection } from '@/features/pharmacy/contracts'
import { TaskPage, TaskSection } from '@/features/platform/components/TaskPage'
import { Callout, Field, Mono, TitleLine, humanize, statusTone } from '@/features/platform/components/rx-ui'
import { RecallTaskActions } from '../components/RecallTaskActions'
import { formatDay } from '@/features/platform/lib/dates'
import { getStoreTimeZone } from '@/features/platform/lib/store-time-zone'

export async function RecallTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const timeZone = await getStoreTimeZone()
  const { id: recallId } = await params
  const response = await platformRequest<{ pharmacyRecallTask: PharmacyRecallTaskProjection }>(`query Task($recallId: ID!) { pharmacyRecallTask(recallId: $recallId) { id recallNumber classification status reason source initiatedAt closedAt locationId locationName approvalRecorded approvedAt approvedBy canQuarantine canClose unlinkedExposureCount exposureReconciliationComplete exposures { id status quantityDispensed contactMethod outcome notes lastActionAt resolvedAt patientId patientDisplayName prescriptionId prescriptionNumber orderId orderNumber } lots { id lotNumber status quantityAvailable quantityQuarantined productTitle productSku locationName } } }`, { recallId })
  if (!response.success) return <TaskPage parent={{ label: 'Recalls', href: '/platform/recalls' }} title="Recall unavailable" description={response.error} />
  const recall = response.data.pharmacyRecallTask
  return <TaskPage parent={{ label: 'Recalls', href: '/platform/recalls' }} meta={`Recall · ${humanize(recall.classification)}`} title={recall.recallNumber} state={humanize(recall.status)} tone={recall.classification === 'class_i' && !['closed', 'resolved'].includes(recall.status) ? 'danger' : statusTone(recall.status)} description={recall.reason}>
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl bg-muted/40 px-4 py-4 ring-1 ring-inset ring-border/60 sm:grid-cols-4 sm:px-5">
      <Field label="Source">{recall.source || 'Not reported'}</Field>
      <Field label="Location">{recall.locationName || 'Organization-wide'}</Field>
      <Field label="Initiated">{formatDay(recall.initiatedAt, timeZone)}</Field>
      <Field label="Approval">{recall.approvalRecorded ? (recall.approvedBy || 'Recorded') : 'Not recorded'}</Field>
    </dl>
    {!recall.exposureReconciliationComplete && <Callout tone="warn" title="Exposure reconciliation incomplete"><Mono>{recall.unlinkedExposureCount}</Mono> sold or dispensed movement(s) have no outreach record. The recall can&apos;t be closed yet.</Callout>}
    <TaskSection title="Affected lots" count={recall.lots.length}><ul className="divide-y">{recall.lots.map((lot) => <li key={lot.id} className="grid gap-1 py-2.5 text-sm first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline sm:gap-4"><TitleLine as="h3" titleClassName="text-sm" title={<Link href={`/dashboard/platform/inventory/${lot.id}`} className="hover:underline hover:underline-offset-4">{lot.productTitle} · <span className="font-mono">{lot.lotNumber}</span></Link>} tone={statusTone(lot.status)} state={humanize(lot.status)} /><Mono className="text-muted-foreground">{lot.quantityQuarantined}/{lot.quantityAvailable} quarantined</Mono></li>)}</ul></TaskSection>
    <TaskSection title="Patient exposure" count={recall.exposures.length}>{recall.exposures.length ? <ul className="divide-y">{recall.exposures.map((entry) => <li key={entry.id} className="grid gap-1 py-2.5 text-sm first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline sm:gap-4"><span className="min-w-0"><TitleLine as="h3" titleClassName="text-sm" title={entry.patientDisplayName} tone={statusTone(entry.status)} state={humanize(entry.status)} /><span className="block font-mono text-[11px] text-muted-foreground">{entry.prescriptionNumber || entry.orderNumber || 'No linked record'}{entry.contactMethod ? ` · ${humanize(entry.contactMethod)}` : ''}</span></span><Mono className="text-muted-foreground">{entry.quantityDispensed} dispensed</Mono></li>)}</ul> : <p className="text-sm text-muted-foreground">No dispensed or sold units for the affected lots.</p>}</TaskSection>
    <TaskSection title="Actions"><RecallTaskActions recall={recall} /></TaskSection>
  </TaskPage>
}
