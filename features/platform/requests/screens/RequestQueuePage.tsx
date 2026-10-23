import Link from 'next/link'

import { PageContainer } from '@/features/dashboard/components/PageContainer'
import { basePath } from '@/features/dashboard/lib/config'
import { keystoneClient } from '@/features/dashboard/lib/keystoneClient'
import { Callout, Count, Dot, EmptyBand, Field, ListBand, PillLink, RaisedLink, TitleLine, Track, humanize, type DotTone } from '@/features/platform/components/rx-ui'
import { RequestActions } from '../components/RequestActions'

type PrescriptionRequest = {
  id: string
  kind: 'registration' | 'transfer' | 'new_prescription'
  status: string
  createdAt: string
  resolvedAt?: string | null
  resolutionNote?: string | null
  locationName: string
  counterpartyName?: string | null
  medications?: string | null
  customerName: string
  customerEmail: string
  patientId?: string | null
  firstName?: string | null
  lastName?: string | null
  dateOfBirth?: string | null
  phone?: string | null
  email?: string | null
  allergies?: string | null
  insurance?: string | null
  counterpartyPhone?: string | null
  prescriberName?: string | null
  prescriberPhone?: string | null
  note?: string | null
}

const KIND_LABELS = { registration: 'Patient registration', transfer: 'Transfer in', new_prescription: 'New prescription' } as const
const STATUS_TABS = [['requested', 'Requested'], ['in_review', 'In review'], ['completed', 'Completed'], ['declined', 'Declined']] as const
const STATUS_TONES: Record<string, DotTone> = { requested: 'warn', in_review: 'info', completed: 'ok', declined: 'muted' }

function day(value?: string | null) {
  return value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : ''
}

export async function RequestQueuePage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  const status = typeof params?.status === 'string' && STATUS_TABS.some(([value]) => value === params.status) ? params.status : null
  const response = await keystoneClient<{ pharmacyPrescriptionRequestQueue: PrescriptionRequest[] }>(
    `query RequestQueue($status: String) { pharmacyPrescriptionRequestQueue(status: $status) { id kind status createdAt resolvedAt resolutionNote locationName counterpartyName medications customerName customerEmail patientId firstName lastName dateOfBirth phone email allergies insurance counterpartyPhone prescriberName prescriberPhone note } }`,
    { status },
  )
  const requests = response.success ? response.data.pharmacyPrescriptionRequestQueue : []
  const open = requests.filter((request) => request.status === 'requested').length
  const href = (value: string | null) => `${basePath}/platform/requests${value ? `?status=${value}` : ''}`

  const header = <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
    <h1 className="text-2xl font-semibold tracking-tight text-foreground">Online requests</h1>
    <Count>{requests.length}</Count>
    {response.success && <span className="inline-flex items-baseline gap-1.5 text-sm text-muted-foreground"><Dot tone={open ? 'warn' : 'ok'} />{open ? `${open} new` : 'Clear'}</span>}
  </div>

  return <PageContainer title="Online requests" header={header} breadcrumbs={[{ type: 'link', label: 'Dashboard', href: basePath }, { type: 'page', label: 'Platform' }, { type: 'page', label: 'Online requests' }]}>
    <div className="space-y-4 px-4 pb-8 md:px-6">
      <Track label="Status">
        <PillLink href={href(null)} active={!status}>All</PillLink>
        {STATUS_TABS.map(([value, label]) => <PillLink key={value} href={href(value)} active={status === value}><Dot tone={STATUS_TONES[value]} className="size-1.5 translate-y-0" />{label}</PillLink>)}
      </Track>
      {!response.success && <Callout tone="danger" title="Couldn't load online requests">{response.error}</Callout>}
      {response.success && !requests.length && <EmptyBand>No online requests{status ? ` ${humanize(status)}` : ''}</EmptyBand>}
      {requests.length > 0 && <ListBand className="bg-border/60">{requests.map((request) => {
        const name = [request.firstName, request.lastName].filter(Boolean).join(' ') || request.customerName
        return <article key={request.id} className="grid gap-4 bg-background px-4 py-4 sm:px-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8">
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground">{KIND_LABELS[request.kind]} · {day(request.createdAt)} · {request.locationName}</p>
            <TitleLine as="h2" className="mt-1" title={name} tone={STATUS_TONES[request.status] || 'muted'} state={humanize(request.status)} />
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{request.customerEmail}{request.patientId ? ' · Linked patient' : ' · Not linked to a patient'}</p>
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
              {request.dateOfBirth && <Field label="Date of birth">{day(request.dateOfBirth)}</Field>}
              {request.phone && <Field label="Phone"><a href={`tel:${request.phone}`} className="font-mono hover:underline">{request.phone}</a></Field>}
              {request.counterpartyName && <Field label="Transfer from">{request.counterpartyName}{request.counterpartyPhone ? <span className="block font-mono text-xs text-muted-foreground">{request.counterpartyPhone}</span> : null}</Field>}
              {request.prescriberName && <Field label="Prescriber">{request.prescriberName}{request.prescriberPhone ? <span className="block font-mono text-xs text-muted-foreground">{request.prescriberPhone}</span> : null}</Field>}
              {request.medications && <Field label="Medications" className="col-span-2 sm:col-span-3"><span className="whitespace-pre-line">{request.medications}</span></Field>}
              {request.allergies && <Field label="Allergies (patient-reported)" className="col-span-2 sm:col-span-3"><span className="whitespace-pre-line">{request.allergies}</span></Field>}
              {request.insurance && <Field label="Insurance" className="col-span-2 sm:col-span-3"><span className="whitespace-pre-line">{request.insurance}</span></Field>}
              {request.note && <Field label="Note" className="col-span-2 sm:col-span-3">{request.note}</Field>}
              {request.resolutionNote && <Field label="Outcome note" className="col-span-2 sm:col-span-3">{request.resolutionNote}</Field>}
            </dl>
          </div>
          <div className="flex min-w-0 flex-col gap-3 border-t border-dashed pt-3 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <RequestActions requestId={request.id} status={request.status} />
            <div className="flex flex-wrap gap-2">
              {!request.patientId && <RaisedLink href={`${basePath}/platform/patients/create`}>Create patient</RaisedLink>}
              {request.kind !== 'registration' && <RaisedLink href={`${basePath}/platform/prescriptions/intake`}>Prescription intake</RaisedLink>}
              {request.patientId && <Link href={`${basePath}/platform/patients/${request.patientId}`} className="inline-flex min-h-9 items-center px-2 text-[13px] font-medium underline underline-offset-4">Patient</Link>}
            </div>
          </div>
        </article>
      })}</ListBand>}
    </div>
  </PageContainer>
}
