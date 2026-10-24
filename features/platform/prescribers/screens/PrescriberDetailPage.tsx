import Link from 'next/link'

import { platformRequest } from '@/features/platform/lib/request'
import { RecordDrawerButton } from '@/features/platform/components/RecordDrawerButton'
import { TaskPage, TaskSection } from '@/features/platform/components/TaskPage'
import { TransitionPills } from '@/features/platform/components/TransitionPills'
import { Field, ListBand, Mono, TitleLine, humanize, statusTone } from '@/features/platform/components/rx-ui'
import { shortDate } from '../../lib/mutate'
import { validatePrescriberThroughProvider } from '../actions'

type Prescriber = {
  id: string; name: string; npi?: string | null; phone?: string | null; fax?: string | null; verificationStatus: string; externalValidationComplete: boolean; verificationMethod: string
  credentialType?: string | null; credentialJurisdiction?: string | null; credentialIdentifier?: string | null; credentialExpiresAt?: string | null; validatedAt?: string | null; verifiedBy?: { name: string } | null
  organization?: { name: string } | null
  prescriptions: Array<{ id: string; prescriptionNumber: string; status: string; createdAt: string; location?: { name: string } | null }>
  prescriptionsCount: number
}

export async function PrescriberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const response = await platformRequest<{ prescriber: Prescriber | null; pharmacyIntegrationStatus: Array<{ id: string; name: string; providerType: string; status: string }> }>(
    `query Prescriber($id: ID!) { prescriber(where: { id: $id }) { id name npi phone fax verificationStatus externalValidationComplete verificationMethod credentialType credentialJurisdiction credentialIdentifier credentialExpiresAt validatedAt verifiedBy { name } organization { name } prescriptionsCount prescriptions(orderBy: [{ createdAt: desc }], take: 25) { id prescriptionNumber status createdAt location { name } } } pharmacyIntegrationStatus { id name providerType status } }`,
    { id },
  )
  const parent = { label: 'Prescribers', href: '/platform/prescribers' }
  if (!response.success || !response.data.prescriber) return <TaskPage parent={parent} title="Prescriber unavailable" description={response.success ? 'Not found' : response.error} />
  const prescriber = response.data.prescriber
  const erx = response.data.pharmacyIntegrationStatus.filter((provider) => provider.providerType === 'erx' && provider.status === 'active')
  const expired = prescriber.credentialExpiresAt ? new Date(prescriber.credentialExpiresAt).getTime() < Date.now() : false

  return <TaskPage parent={parent} meta={prescriber.npi ? `NPI ${prescriber.npi}` : 'Prescriber'} title={prescriber.name} state={expired ? 'Credential expired' : humanize(prescriber.verificationStatus)} tone={expired ? 'danger' : statusTone(prescriber.verificationStatus === 'unverified' ? 'not_reviewed' : prescriber.verificationStatus)} description={prescriber.organization?.name} actions={<RecordDrawerButton listPath="prescribers" itemId={prescriber.id} label="Edit" />}>
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl bg-muted/40 px-4 py-4 ring-1 ring-inset ring-border/60 sm:grid-cols-4 sm:px-5">
      <Field label="Phone">{prescriber.phone ? <Mono>{prescriber.phone}</Mono> : 'Not recorded'}</Field>
      <Field label="Fax">{prescriber.fax ? <Mono>{prescriber.fax}</Mono> : 'Not recorded'}</Field>
      <Field label="Prescriptions"><Mono>{prescriber.prescriptionsCount}</Mono></Field>
      <Field label="NPI">{prescriber.npi ? <Mono>{prescriber.npi}</Mono> : 'Not recorded'}</Field>
    </dl>

    <TaskSection title="Credential" action={<Link href="/dashboard/platform/credentials" className="text-[13px] font-medium underline underline-offset-4">Record review</Link>}>
      {prescriber.externalValidationComplete
        ? <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          <Field label="Type">{prescriber.credentialType || 'Not recorded'}</Field>
          <Field label="Jurisdiction">{prescriber.credentialJurisdiction || 'Not recorded'}</Field>
          <Field label="Expires">{shortDate(prescriber.credentialExpiresAt) || 'Not recorded'}</Field>
          <Field label="Verified">{humanize(prescriber.verificationMethod)}{prescriber.verifiedBy ? ` · ${prescriber.verifiedBy.name}` : ''}{prescriber.validatedAt ? ` · ${shortDate(prescriber.validatedAt)}` : ''}</Field>
        </dl>
        : <p className="text-sm text-muted-foreground">No credential evidence recorded.</p>}
      {erx.length > 0 && prescriber.npi && <div className="mt-4 grid gap-2"><span className="text-sm font-medium">Validate through eRx</span><TransitionPills label="eRx validation" options={erx.map((provider) => ({ label: provider.name, action: validatePrescriberThroughProvider.bind(null, prescriber.id, provider.id) }))} /></div>}
    </TaskSection>

    <TaskSection title="Prescriptions" count={prescriber.prescriptionsCount}>
      {prescriber.prescriptions.length ? <ListBand>{prescriber.prescriptions.map((prescription) => <Link key={prescription.id} href={`/dashboard/platform/prescriptions/${prescription.id}`} className="block bg-background px-3.5 py-2.5 hover:bg-muted/40"><TitleLine as="h3" titleClassName="text-sm font-mono" title={prescription.prescriptionNumber} tone={statusTone(prescription.status)} state={humanize(prescription.status)} /><span className="font-mono text-[11px] text-muted-foreground">{shortDate(prescription.createdAt)}{prescription.location ? ` · ${prescription.location.name}` : ''}</span></Link>)}</ListBand> : <p className="text-sm text-muted-foreground">No prescriptions from this prescriber.</p>}
    </TaskSection>
  </TaskPage>
}
