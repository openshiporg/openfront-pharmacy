import Link from 'next/link'

import { platformRequest } from '@/features/platform/lib/request'
import { RecordDrawerButton } from '@/features/platform/components/RecordDrawerButton'
import { TaskPage, TaskSection } from '@/features/platform/components/TaskPage'
import { Callout, Field, ListBand, Mono, TitleLine, humanize, statusTone } from '@/features/platform/components/rx-ui'
import { shortDate } from '../../lib/mutate'
import { DrugReviewForm } from '../components/DrugReviewForm'

type Drug = {
  id: string; ndc11: string; proprietaryName: string; genericName?: string | null; labelerName?: string | null; dosageForm?: string | null; route?: string | null; strength?: string | null; rxNormCui?: string | null
  controlledSchedule: string; marketingStatus: string; sourceName?: string | null; sourceVersion?: string | null; sourceReference?: string | null; reviewedAt?: string | null
  products: Array<{ id: string; title: string; sku: string; status: string }>
  reviews: Array<{ id: string; status: string; marketingStatusSnapshot: string; controlledScheduleSnapshot: string; sourceName: string; sourceVersion: string; sourceReference: string; reviewedAt: string; reviewedBy?: { name: string } | null; organization?: { name: string } | null }>
}

export async function DrugReferenceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const response = await platformRequest<{ drugReference: Drug | null; organizations: Array<{ id: string; name: string }> }>(
    `query Drug($id: ID!) { drugReference(where: { id: $id }) { id ndc11 proprietaryName genericName labelerName dosageForm route strength rxNormCui controlledSchedule marketingStatus sourceName sourceVersion sourceReference reviewedAt products(orderBy: [{ title: asc }], take: 50) { id title sku status } reviews(orderBy: [{ reviewedAt: desc }]) { id status marketingStatusSnapshot controlledScheduleSnapshot sourceName sourceVersion sourceReference reviewedAt reviewedBy { name } organization { name } } } organizations(take: 20, orderBy: { name: asc }) { id name } }`,
    { id },
  )
  const parent = { label: 'Drug references', href: '/platform/drug-references' }
  if (!response.success || !response.data.drugReference) return <TaskPage parent={parent} title="Drug reference unavailable" description={response.success ? 'Not found' : response.error} />
  const drug = response.data.drugReference
  const activeReview = drug.reviews.find((review) => review.status === 'active')
  const name = `${drug.proprietaryName}${drug.strength ? ` ${drug.strength}` : ''}`

  return <TaskPage parent={parent} meta={`NDC ${drug.ndc11}`} title={name} state={activeReview ? humanize(activeReview.marketingStatusSnapshot) : 'Not reviewed'} tone={activeReview ? statusTone(activeReview.marketingStatusSnapshot === 'active' ? 'active' : 'inactive') : 'warn'} description={drug.genericName || undefined} actions={<RecordDrawerButton listPath="drug-references" itemId={drug.id} label="Edit" />}>
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl bg-muted/40 px-4 py-4 ring-1 ring-inset ring-border/60 sm:grid-cols-4 sm:px-5">
      <Field label="Dosage form">{drug.dosageForm || 'Not recorded'}</Field>
      <Field label="Route">{drug.route || 'Not recorded'}</Field>
      <Field label="Schedule">{humanize(drug.controlledSchedule)}</Field>
      <Field label="Labeler">{drug.labelerName || 'Not recorded'}</Field>
      {drug.rxNormCui && <Field label="RxNorm"><Mono>{drug.rxNormCui}</Mono></Field>}
    </dl>
    {activeReview?.controlledScheduleSnapshot === 'controlled_or_unsupported' && <Callout tone="warn" title="Controlled or unsupported">Controlled substances are not supported for intake or dispensing.</Callout>}
    {drug.reviews.length > 0 && <Callout tone="muted">NDC, ingredient, strength, dosage form and route are locked after the first review.</Callout>}

    <TaskSection title="Reviews" count={drug.reviews.length}>
      {drug.reviews.length ? <ListBand className="mb-5">{drug.reviews.map((review) => <div key={review.id} className="bg-background px-3.5 py-2.5 text-sm">
        <TitleLine as="h3" titleClassName="text-sm" title={`${review.sourceName} ${review.sourceVersion}`} tone={statusTone(review.status === 'active' ? 'active' : review.status)} state={humanize(review.status)} />
        <p className="mt-0.5 text-muted-foreground">{humanize(review.marketingStatusSnapshot)} · {humanize(review.controlledScheduleSnapshot)} · {review.sourceReference}</p>
        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{review.reviewedBy?.name}{review.organization ? ` · ${review.organization.name}` : ''} · {shortDate(review.reviewedAt)}</p>
      </div>)}</ListBand> : null}
      <DrugReviewForm drugReferenceId={drug.id} organizations={response.data.organizations} />
    </TaskSection>

    <TaskSection title="Products" count={drug.products.length}>
      {drug.products.length ? <ListBand>{drug.products.map((product) => <Link key={product.id} href={`/dashboard/platform/products/${product.id}`} className="block bg-background px-3.5 py-2.5 hover:bg-muted/40"><TitleLine as="h3" titleClassName="text-sm" title={product.title} tone={statusTone(product.status === 'published' ? 'active' : product.status === 'archived' ? 'inactive' : 'draft')} state={humanize(product.status)} /><span className="font-mono text-[11px] text-muted-foreground">{product.sku}</span></Link>)}</ListBand> : <p className="text-sm text-muted-foreground">No products use this reference.</p>}
    </TaskSection>
  </TaskPage>
}
