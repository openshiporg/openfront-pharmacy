'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState, type ReactNode } from 'react'
import { ChevronDown, ChevronRight, Plus, Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { PageContainer } from '@/features/dashboard/components/PageContainer'
import { basePath } from '@/features/dashboard/lib/config'
import { cn } from '@/lib/utils'
import { CreateItemDrawerClientWrapper } from './CreateItemDrawerClientWrapper'
import { Callout, Count, Dot, EmptyBand, Field, ListBand, Pill, Track, humanize, primaryPillClass, statusTone, trackClass } from './rx-ui'

export type OperationalItem = {
  id: string
  href?: string
  title: string
  subtitle?: string
  status?: string
  details?: Array<{ label: string; value: string }>
  /** Row actions (state transitions) rendered next to the row. */
  actions?: ReactNode
}

type SortMode = 'default' | 'title-asc' | 'status'

const ALL = 'all'

function statusLabel(status?: string) {
  return status ? humanize(status) : 'Unknown'
}

function OperationalRow({ item, attention }: { item: OperationalItem; attention: boolean }) {
  const [open, setOpen] = useState(false)
  const preview = item.details?.slice(0, 3) || []
  return <div className="bg-background">
    <div className="grid gap-3 px-4 py-3.5 sm:px-5 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_auto] md:items-center md:gap-6">
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <h2 className="min-w-0 truncate text-[15px] font-semibold tracking-tight text-foreground">{item.href ? <Link href={item.href} className="hover:underline hover:underline-offset-4">{item.title}</Link> : item.title}</h2>
          <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap text-sm capitalize text-muted-foreground"><Dot tone={attention ? 'warn' : statusTone(item.status)} />{statusLabel(item.status)}</span>
        </div>
        {item.subtitle && <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">{item.subtitle}</p>}
      </div>
      <dl className="hidden min-w-0 grid-cols-3 gap-4 md:grid">
        {preview.map((detail) => <div key={detail.label} className="min-w-0"><dt className="truncate font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">{detail.label}</dt><dd className="mt-0.5 truncate text-[13px] font-medium" title={detail.value}>{detail.value || 'Not recorded'}</dd></div>)}
      </dl>
      <div className="flex flex-wrap items-center gap-1.5 justify-self-start md:justify-self-end">
        {item.actions}
        {Boolean(item.details?.length) && <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls={`details-${item.id}`} className="inline-flex min-h-9 items-center gap-1 rounded-full px-3 text-[13px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground max-sm:min-h-10">Details<ChevronDown aria-hidden="true" className={cn('size-3.5 transition-transform duration-200', open && 'rotate-180')} /></button>}
        {item.href && <Link href={item.href} aria-label={`Open ${item.title}`} className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground max-sm:size-10"><ChevronRight aria-hidden="true" className="size-4" /></Link>}
      </div>
    </div>
    {open && <dl id={`details-${item.id}`} className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-dashed bg-muted/30 px-4 py-4 sm:px-5 lg:grid-cols-4">
      {item.details?.map((detail) => <Field key={detail.label} label={detail.label}>{detail.value || 'Not recorded'}</Field>)}
    </dl>}
  </div>
}

export function OperationalPage(props: {
  title: string
  description: string
  items: OperationalItem[]
  emptyMessage: string
  error?: string
  disabledMessage?: string
  /** A link to a create screen, or a Keystone list key to create through the reference create drawer. */
  primaryAction?: { href: string; label: string } | { listKey: string; label: string }
  /** Extra content above the list: secondary tracks, summaries. */
  toolbar?: ReactNode
  attentionStatuses?: string[]
}) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState(ALL)
  const [sort, setSort] = useState<SortMode>('default')
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const attentionStatuses = useMemo(() => new Set(props.attentionStatuses || []), [props.attentionStatuses])
  const statusCounts = useMemo(() => props.items.reduce<Map<string, number>>((counts, item) => item.status ? counts.set(item.status, (counts.get(item.status) || 0) + 1) : counts, new Map()), [props.items])
  const statuses = useMemo(() => Array.from(statusCounts.keys()).sort(), [statusCounts])
  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase()
    const result = props.items.filter((item) => {
      const searchable = [item.title, item.subtitle, item.status, ...(item.details || []).flatMap((detail) => [detail.label, detail.value])].filter(Boolean).join(' ').toLocaleLowerCase()
      return (!normalized || searchable.includes(normalized)) && (status === ALL || item.status === status)
    })
    if (sort === 'default') return result
    return [...result].sort((a, b) => sort === 'status'
      ? statusLabel(a.status).localeCompare(statusLabel(b.status)) || a.title.localeCompare(b.title)
      : a.title.localeCompare(b.title))
  }, [props.items, query, sort, status])
  const attentionCount = props.items.filter((item) => item.status && attentionStatuses.has(item.status)).length

  const breadcrumbs = [
    { type: 'link' as const, label: 'Dashboard', href: basePath },
    { type: 'page' as const, label: 'Platform' },
    { type: 'page' as const, label: props.title },
  ]

  const action = props.primaryAction && ('href' in props.primaryAction
    ? <Link href={props.primaryAction.href} className={primaryPillClass}><Plus aria-hidden="true" className="size-4" />{props.primaryAction.label}</Link>
    : <button type="button" className={primaryPillClass} onClick={() => setCreateOpen(true)}><Plus aria-hidden="true" className="size-4" />{props.primaryAction.label}</button>)

  const header = <div className="flex flex-wrap items-end justify-between gap-3">
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{props.title}</h1>
      <Count>{props.items.length}</Count>
      {!props.error && props.items.length > 0 && attentionStatuses.size > 0 && <span className="inline-flex items-baseline gap-1.5 text-sm text-muted-foreground"><Dot tone={attentionCount ? 'warn' : 'ok'} />{attentionCount ? `${attentionCount} need attention` : 'Clear'}</span>}
    </div>
    {!props.error && action}
  </div>

  return (
    <PageContainer title={props.title} header={header} breadcrumbs={breadcrumbs}>
      <div className="space-y-4 px-4 pb-8 md:px-6">
        {props.error && <Callout tone="danger" title={`Couldn't load ${props.title.toLocaleLowerCase()}`}>{props.error}</Callout>}
        {!props.error && props.disabledMessage && props.items.length === 0 && <Callout tone="muted">{props.disabledMessage}</Callout>}
        {!props.error && props.toolbar}

        {!props.error && props.items.length > 0 && <>
          <div className="flex flex-wrap items-center gap-2">
            <label className={cn(trackClass, 'relative min-w-0 flex-1 basis-56 overflow-visible')}>
              <span className="sr-only">Search {props.title.toLocaleLowerCase()}</span>
              <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" className="h-8 rounded-full border-0 bg-transparent pl-8 shadow-none focus-visible:ring-0 max-sm:h-10 dark:bg-transparent" />
            </label>
            <Track label="Sort">
              <Pill active={sort === 'default'} onClick={() => setSort('default')}>Recent</Pill>
              <Pill active={sort === 'title-asc'} onClick={() => setSort('title-asc')}>Name</Pill>
              <Pill active={sort === 'status'} onClick={() => setSort('status')}>Status</Pill>
            </Track>
          </div>
          {statuses.length > 1 && <Track label="Status">
            <Pill active={status === ALL} onClick={() => setStatus(ALL)}>All <Count>{props.items.length}</Count></Pill>
            {statuses.map((entry) => <Pill key={entry} active={status === entry} onClick={() => setStatus(entry)} className="capitalize"><Dot tone={attentionStatuses.has(entry) ? 'warn' : statusTone(entry)} className="size-1.5 translate-y-0" />{statusLabel(entry)} <Count>{statusCounts.get(entry)}</Count></Pill>)}
          </Track>}

          <p className="font-mono text-[11px] tabular-nums text-muted-foreground" aria-live="polite">{filteredItems.length} of {props.items.length}</p>
          {filteredItems.length === 0
            ? <EmptyBand>No results match these filters</EmptyBand>
            : <ListBand aria-label={props.title} className="bg-border/60">{filteredItems.map((item) => <OperationalRow key={item.id} item={item} attention={Boolean(item.status && attentionStatuses.has(item.status))} />)}</ListBand>}
        </>}

        {props.primaryAction && 'listKey' in props.primaryAction && (
          <CreateItemDrawerClientWrapper listKey={props.primaryAction.listKey} open={createOpen} onClose={() => setCreateOpen(false)} onCreate={() => router.refresh()} />
        )}

        {!props.error && props.items.length === 0 && !props.disabledMessage && <EmptyBand>{props.emptyMessage}</EmptyBand>}
      </div>
    </PageContainer>
  )
}
