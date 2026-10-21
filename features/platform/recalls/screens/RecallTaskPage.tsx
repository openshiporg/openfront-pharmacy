import { keystoneClient } from '@/features/dashboard/lib/keystoneClient'
import type { PharmacyRecallTaskProjection } from '@/features/pharmacy/contracts'
import { TaskPage, TaskSection } from '@/features/platform/components/TaskPage'
import { RecallTaskActions } from '../components/RecallTaskActions'

export async function RecallTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: recallId } = await params
  const response = await keystoneClient<{ pharmacyRecallTask: PharmacyRecallTaskProjection }>(`query Task($recallId: ID!) { pharmacyRecallTask(recallId: $recallId) { id recallNumber classification status reason source initiatedAt closedAt locationId locationName approvalRecorded approvedAt approvedBy canQuarantine canClose unlinkedExposureCount exposureReconciliationComplete exposures { id status quantityDispensed contactMethod outcome notes lastActionAt resolvedAt patientId patientDisplayName prescriptionId prescriptionNumber orderId orderNumber } lots { id lotNumber status quantityAvailable quantityQuarantined productTitle productSku locationName } } }`, { recallId })
  if (!response.success) return <TaskPage parent={{ label: 'Recalls', href: '/platform/recalls' }} title="Recall unavailable" description={response.error} />
  const recall = response.data.pharmacyRecallTask
  return <TaskPage parent={{ label: 'Recalls', href: '/platform/recalls' }} meta={`Recall · ${recall.classification.replaceAll('_', ' ')} · ${recall.status.replaceAll('_', ' ')}`} title={recall.recallNumber} description={recall.reason}>
    {!recall.exposureReconciliationComplete && <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">Exposure reconciliation incomplete: {recall.unlinkedExposureCount} sold or dispensed movement(s) have no outreach record. The recall can&apos;t be closed yet.</div>}<TaskSection title="Patient exposure">{recall.exposures.length ? recall.exposures.map((entry) => <div key={entry.id} className="grid gap-2 border-b py-3 text-sm last:border-0 sm:grid-cols-4"><span className="font-medium">{entry.patientDisplayName}</span><span>{entry.prescriptionNumber || 'Prescription'}</span><span>{entry.quantityDispensed} dispensed</span><span className="capitalize">{entry.status.replaceAll('_', ' ')}</span></div>) : <p className="text-sm text-muted-foreground">No dispensed or sold units for the affected lots.</p>}</TaskSection>
    <TaskSection title="Affected lots">{recall.lots.map((lot) => <div key={lot.id} className="grid gap-2 border-b py-3 text-sm last:border-0 sm:grid-cols-4"><span className="font-medium">{lot.productTitle}</span><span>{lot.lotNumber}</span><span className="capitalize">{lot.status}</span><span>{lot.quantityQuarantined}/{lot.quantityAvailable} quarantined</span></div>)}</TaskSection>
    <TaskSection title="Actions"><RecallTaskActions recall={recall} /></TaskSection>
  </TaskPage>
}
