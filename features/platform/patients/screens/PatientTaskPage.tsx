import { keystoneClient } from '@/features/dashboard/lib/keystoneClient'
import type { PatientSafeProjection, PharmacyTaskOption } from '@/features/pharmacy/contracts'
import { TaskPage, TaskSection } from '@/features/platform/components/TaskPage'
import { Dot, Field, ListBand, Mono, SectionTitle, TitleLine, humanize, statusTone } from '@/features/platform/components/rx-ui'
import { PatientAccountLinkForm } from '../components/PatientAccountLinkForm'
import { PatientContactForm } from '../components/PatientContactForm'
import { PatientHistoryForms } from '../components/PatientHistoryForms'

export async function PatientTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: patientId } = await params
  const response = await keystoneClient<{ pharmacyPatientSafeView: PatientSafeProjection; pharmacyPatientAccountCandidates: PharmacyTaskOption[] }>(`query Patient($patientId: ID!) { pharmacyPatientSafeView(patientId: $patientId) { id patientNumber displayName status email phone address preferredContactMethod identityVerificationStatus hasIdentityEvidence organizationNames prescriptionCount activeConsentCount latestConsentAt allergies { id allergen reaction severity status source recordedAt } medications { id medicationName directions status source recordedAt } } pharmacyPatientAccountCandidates(patientId: $patientId) { id label scopeId detail } }`, { patientId })
  if (!response.success) return <TaskPage parent={{ label: 'Patients', href: '/platform/patients' }} title="Patient unavailable" description={response.error} />
  const patient = response.data.pharmacyPatientSafeView
  return <TaskPage parent={{ label: 'Patients', href: '/platform/patients' }} meta={`Patient ${patient.patientNumber}`} title={patient.displayName} state={humanize(patient.status)} tone={statusTone(patient.status)} description={patient.organizationNames.join(', ')}>
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl bg-muted/40 px-4 py-4 ring-1 ring-inset ring-border/60 sm:grid-cols-4 sm:px-5">
      <Field label="Identity"><span className="inline-flex items-baseline gap-1.5 capitalize"><Dot tone={patient.hasIdentityEvidence && patient.identityVerificationStatus === 'confirmed' ? 'ok' : 'warn'} />{patient.hasIdentityEvidence ? humanize(patient.identityVerificationStatus) : 'Not recorded'}</span></Field>
      <Field label="Contact"><span className="capitalize">{humanize(patient.preferredContactMethod)}</span></Field>
      <Field label="Prescriptions"><Mono>{patient.prescriptionCount}</Mono></Field>
      <Field label="Active consents"><Mono>{patient.activeConsentCount}</Mono></Field>
    </dl>
    <TaskSection title="Safety history">
      <div className="grid gap-5 md:grid-cols-2">
        <div><SectionTitle meta={patient.allergies.length}>Allergies</SectionTitle>{patient.allergies.length ? <ListBand>{patient.allergies.map((entry) => <div key={entry.id} className="bg-background px-3.5 py-2.5 text-sm"><TitleLine as="h3" titleClassName="text-sm" title={entry.allergen} tone={entry.severity === 'severe' || entry.severity === 'life_threatening' ? 'danger' : 'warn'} state={humanize(entry.severity)} /><p className="mt-0.5 text-muted-foreground">{entry.reaction} · {humanize(entry.source)}</p></div>)}</ListBand> : <p className="text-sm text-muted-foreground">No allergy records on file.</p>}</div>
        <div><SectionTitle meta={patient.medications.length}>Current medications</SectionTitle>{patient.medications.length ? <ListBand>{patient.medications.map((entry) => <div key={entry.id} className="bg-background px-3.5 py-2.5 text-sm"><p className="font-semibold">{entry.medicationName}</p><p className="mt-0.5 text-muted-foreground">{entry.directions || 'Directions not recorded'} · {humanize(entry.source)}</p></div>)}</ListBand> : <p className="text-sm text-muted-foreground">No current medication records on file.</p>}</div>
      </div>
      <div className="mt-5 border-t border-dashed pt-5"><PatientHistoryForms patientId={patient.id} /></div>
    </TaskSection>
    <TaskSection title="Contact"><PatientContactForm patientId={patient.id} email={patient.email} phone={patient.phone} preferredContactMethod={patient.preferredContactMethod} address={patient.address as any} /></TaskSection>
    <TaskSection title="Account access"><PatientAccountLinkForm patientId={patient.id} candidates={response.data.pharmacyPatientAccountCandidates} /></TaskSection>
  </TaskPage>
}
