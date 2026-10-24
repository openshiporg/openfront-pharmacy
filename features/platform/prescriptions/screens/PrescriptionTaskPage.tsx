import { keystoneClient } from '@/features/dashboard/lib/keystoneClient'
import type { PharmacyPrescriptionTaskProjection } from '@/features/pharmacy/contracts'
import { TaskPage, TaskSection } from '@/features/platform/components/TaskPage'
import { Callout, Field, ListBand, Mono, SectionTitle, TitleLine, humanize, statusTone } from '@/features/platform/components/rx-ui'
import { DispensingLabelCard } from '../components/DispensingLabelCard'
import { PrescriptionFillWorkbench } from '../components/PrescriptionFillWorkbench'
import { fillWorkbenchSelection, type PharmacyFillWorkbench } from '@/features/pharmacy/fills'
import { PrescriptionTaskActions } from '../components/PrescriptionTaskActions'
import { TransferOutForm } from '../components/TransferOutForm'

export async function PrescriptionTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: prescriptionId } = await params
  const response = await keystoneClient<{ pharmacyPrescriptionTask: PharmacyPrescriptionTaskProjection }>(`query Task($prescriptionId: ID!) { pharmacyPrescriptionTask(prescriptionId: $prescriptionId) { id prescriptionNumber status source sourceVerificationStatus writtenAt expiresAt patientId patientDisplayName patientIdentityVerificationStatus patientIdentityEvidenceRecorded prescriberId prescriberName prescriberVerificationStatus locationId locationName operatorDisplayName operatorPhone cashSalesEnabled cashTaxRateBps approvalRecorded approvedAt availableActions items { id fillLineage medicationName sig quantityPrescribed daysSupply refillsAuthorized refillsRemaining substitutionAllowed productId productTitle productSku priceAmount currencyCode taxable eligibleLots { id lotNumber expirationDate eligibleQuantity coldChainRequired } } patientAllergies { id allergen reaction severity } patientMedications { id medicationName directions } safetyReviews { id fillNumber outcome reviewReference notes overrideReason reviewedAt pharmacistName } dispensingLabels { id labelNumber fillNumber operatorName operatorPhone locationName locationAddress patientName prescriberName medicationName sig quantityDispensed lotNumber ndc11 expirationDate auxiliaryWarnings counselingOutcome dispensedAt } refillRequests { id status requestNote resolutionNote requestedAt resolvedAt prescriptionItemId medicationName } transfers { id direction status counterpartyName counterpartyPhone requestedAt completedAt consentRecorded } reviews { id decision reason reviewedAt pharmacistName } } }`, { prescriptionId })
  if (!response.success) return <TaskPage parent={{ label: 'Prescriptions', href: '/platform/prescriptions' }} title="Prescription unavailable" description={response.error} />
  const prescription = response.data.pharmacyPrescriptionTask
  const fillResponse = await keystoneClient<{ pharmacyFillWorkbench: PharmacyFillWorkbench }>(`query FillWorkbench($prescriptionId: ID!) { pharmacyFillWorkbench(prescriptionId: $prescriptionId) { ${fillWorkbenchSelection} } }`, { prescriptionId })
  const workbench = fillResponse.success ? fillResponse.data.pharmacyFillWorkbench : undefined
  const identityConfirmed = prescription.patientIdentityEvidenceRecorded && prescription.patientIdentityVerificationStatus === 'confirmed'
  return <TaskPage parent={{ label: 'Prescriptions', href: '/platform/prescriptions' }} meta="Prescription" title={prescription.prescriptionNumber} state={humanize(prescription.status)} tone={statusTone(prescription.status)} description={`${prescription.patientDisplayName} · ${prescription.prescriberName} · ${prescription.locationName}`}>
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl bg-muted/40 px-4 py-4 ring-1 ring-inset ring-border/60 sm:grid-cols-4 sm:px-5">
      <Field label="Source">{humanize(prescription.source)} · {humanize(prescription.sourceVerificationStatus)}</Field>
      <Field label="Prescriber">{humanize(prescription.prescriberVerificationStatus)}</Field>
      <Field label="Written">{prescription.writtenAt ? new Date(prescription.writtenAt).toLocaleDateString() : 'Not reported'}</Field>
      <Field label="Expires">{prescription.expiresAt ? new Date(prescription.expiresAt).toLocaleDateString() : 'Not reported'}</Field>
    </dl>
    <TaskSection title="Medication" count={prescription.items.length}><div className="divide-y">{prescription.items.map((item) => <div key={item.id} className="py-3 first:pt-0 last:pb-0">
      <p className="font-semibold">{item.medicationName}</p>
      <p className="mt-1 text-sm text-muted-foreground">{item.sig}</p>
      <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
        <Field label="Quantity"><Mono>{item.quantityPrescribed}</Mono></Field>
        <Field label="Days supply"><Mono>{item.daysSupply ?? '—'}</Mono></Field>
        <Field label="Refills left"><Mono>{item.refillsRemaining}</Mono></Field>
        <Field label="Eligible lots"><Mono>{item.eligibleLots.length}</Mono></Field>
      </dl>
    </div>)}</div></TaskSection>
    <TaskSection title="Patient safety">
      <div className="mb-4"><TitleLine as="h3" title="Identity evidence" tone={identityConfirmed ? 'ok' : 'warn'} state={prescription.patientIdentityEvidenceRecorded ? humanize(prescription.patientIdentityVerificationStatus) : 'Not recorded'} /></div>
      <div className="grid gap-5 md:grid-cols-2">
        <div><SectionTitle meta={prescription.patientAllergies.length}>Allergies</SectionTitle>{prescription.patientAllergies.length ? <ListBand>{prescription.patientAllergies.map((entry) => <div key={entry.id} className="bg-background px-3.5 py-2.5 text-sm"><TitleLine as="h3" title={entry.allergen} titleClassName="text-sm" tone={entry.severity === 'severe' || entry.severity === 'life_threatening' ? 'danger' : 'warn'} state={humanize(entry.severity)} /><p className="mt-0.5 text-muted-foreground">{entry.reaction}</p></div>)}</ListBand> : <Callout tone="warn">No allergy records. Record “no known allergies” before safety review.</Callout>}</div>
        <div><SectionTitle meta={prescription.patientMedications.length}>Current medications</SectionTitle>{prescription.patientMedications.length ? <ListBand>{prescription.patientMedications.map((entry) => <div key={entry.id} className="bg-background px-3.5 py-2.5 text-sm"><p className="font-semibold">{entry.medicationName}</p>{entry.directions && <p className="mt-0.5 text-muted-foreground">{entry.directions}</p>}</div>)}</ListBand> : <Callout tone="warn">No medication records. Record “no current medications” before safety review.</Callout>}</div>
      </div>
    </TaskSection>
    <TaskSection title="Fills">{workbench ? <PrescriptionFillWorkbench prescriptionId={prescription.id} workbench={workbench} /> : <Callout tone="danger" title="Couldn't load fills">{fillResponse.success ? null : fillResponse.error}</Callout>}</TaskSection>
    <TaskSection title="Actions"><PrescriptionTaskActions prescription={prescription} workbench={workbench} /></TaskSection>
    <TaskSection title="Transfers" count={prescription.transfers.length}>
      {prescription.transfers.length > 0 && <ListBand className="mb-4">{prescription.transfers.map((transfer) => <div key={transfer.id} className="bg-background px-3.5 py-2.5 text-sm"><TitleLine as="h3" titleClassName="text-sm capitalize" title={`${transfer.direction} · ${transfer.counterpartyName}`} tone={statusTone(transfer.status)} state={humanize(transfer.status)} /><p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{transfer.counterpartyPhone || 'No phone'} · {new Date(transfer.requestedAt).toLocaleDateString()}</p></div>)}</ListBand>}
      {!['rejected', 'cancelled'].includes(prescription.status) && <TransferOutForm prescriptionId={prescription.id} patientId={prescription.patientId} />}
    </TaskSection>
    <TaskSection title="Safety reviews" count={prescription.safetyReviews.length}>{prescription.safetyReviews.length ? <div className="divide-y">{prescription.safetyReviews.map((review) => <div key={review.id} className="py-3 text-sm first:pt-0 last:pb-0"><TitleLine as="h3" title={`Fill ${review.fillNumber}`} titleClassName="text-sm" tone={statusTone(review.outcome)} state={humanize(review.outcome)} /><p className="mt-0.5 text-muted-foreground">{review.reviewReference}</p>{review.overrideReason && <p className="mt-1 text-amber-800 dark:text-amber-200">Override: {review.overrideReason}</p>}<p className="mt-1 font-mono text-[11px] text-muted-foreground">{review.pharmacistName} · {new Date(review.reviewedAt).toLocaleString()}</p></div>)}</div> : <p className="text-sm text-muted-foreground">No safety review recorded for the current fill.</p>}</TaskSection>
    {prescription.dispensingLabels.length > 0 && <TaskSection title="Dispensing labels" count={prescription.dispensingLabels.length}><div className="grid gap-3">{prescription.dispensingLabels.map((label) => <DispensingLabelCard key={label.id} label={label} />)}</div></TaskSection>}
    <TaskSection title="Pharmacist reviews" count={prescription.reviews.length}>{prescription.reviews.length ? <div className="divide-y">{prescription.reviews.map((review) => <div key={review.id} className="py-3 text-sm first:pt-0 last:pb-0"><TitleLine as="h3" title={humanize(review.decision)} titleClassName="text-sm capitalize" /><p className="mt-0.5 text-muted-foreground">{review.reason}</p><p className="mt-1 font-mono text-[11px] text-muted-foreground">{review.pharmacistName} · {new Date(review.reviewedAt).toLocaleString()}</p></div>)}</div> : <p className="text-sm text-muted-foreground">No reviews recorded.</p>}</TaskSection>
  </TaskPage>
}
