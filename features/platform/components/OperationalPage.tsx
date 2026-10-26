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
import { Callout, Count, Dot, EmptyBand, Field, Pill, StatusText, Track, buttonClass, humanize, primaryPillClass, statusTone } from './rx-ui'

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

function OperationalRow({ item, attention, columns }: { item: OperationalItem; attention: boolean; columns: string[] }) {
  const [open, setOpen] = useState(false)
  const value = (label: string) => item.details?.find((detail) => detail.label === label)?.value
  return <>
    <tr className="border-b border-border/70 transition-colors last:border-b-0 hover:bg-muted/30">
      <td className="px-3 py-2 align-baseline">
        <span className="block min-w-0 font-medium text-foreground">{item.href ? <Link href={item.href} className="underline-offset-4 hover:underline">{item.title}</Link> : item.title}</span>
        {item.subtitle && <span className="block truncate text-xs text-muted-foreground">{item.subtitle}</span>}
      </td>
      {columns.map((label) => <td key={label} className="max-w-56 truncate px-3 py-2 align-baseline text-muted-foreground" title={value(label)}>{value(label) || '—'}</td>)}
      <td className="whitespace-nowrap px-3 py-2 align-baseline"><StatusText tone={attention ? 'warn' : statusTone(item.status)}>{statusLabel(item.status)}</StatusText></td>
      <td className="px-3 py-1.5 text-right align-baseline">
        <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
          {item.actions}
          {Boolean(item.details?.length) && <button type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-controls={`details-${item.id}`} className={cn(buttonClass, 'border-transparent bg-transparent px-2 shadow-none text-muted-foreground')}>Details<ChevronDown aria-hidden="true" className={cn('size-3.5 transition-transform duration-200', open && 'rotate-180')} /></button>}
          {item.href && <Link href={item.href} aria-label={`Open ${item.title}`} className={cn(buttonClass, 'size-8 px-0 max-sm:size-10')}><ChevronRight aria-hidden="true" className="size-4" /></Link>}
        </div>
      </td>
    </tr>
    {open && <tr className="border-b border-border/70 bg-muted/30"><td colSpan={columns.length + 3} className="px-3 py-3">
      <dl id={`details-${item.id}`} className="grid grid-cols-2 gap-x-6 gap-y-3 lg:grid-cols-4">
        {item.details?.map((detail) => <Field key={detail.label} label={detail.label}>{detail.value || 'Not recorded'}</Field>)}
      </dl>
    </td></tr>}
  </>
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
  // The first three detail labels become table columns; the rest stay in the row's details.
  const columns = useMemo(() => (props.items.find((item) => item.details?.length)?.details || []).slice(0, 3).map((detail) => detail.label), [props.items])

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
      <h1 className="text-lg font-semibold tracking-tight text-foreground">{props.title}</h1>
      <Count>{props.items.length}</Count>
      {!props.error && props.items.length > 0 && attentionStatuses.size > 0 && <StatusText tone={attentionCount ? 'warn' : 'ok'}>{attentionCount ? `${attentionCount} need attention` : 'Clear'}</StatusText>}
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
          <div className="flex flex-col gap-3 border-b border-border lg:flex-row lg:items-end lg:justify-between">
            {statuses.length > 1 ? <Track label="Status" className="border-b-0">
              <Pill active={status === ALL} onClick={() => setStatus(ALL)}>All <Count>{props.items.length}</Count></Pill>
              {statuses.map((entry) => <Pill key={entry} active={status === entry} onClick={() => setStatus(entry)}><Dot tone={attentionStatuses.has(entry) ? 'warn' : statusTone(entry)} />{statusLabel(entry).charAt(0).toUpperCase() + statusLabel(entry).slice(1)} <Count>{statusCounts.get(entry)}</Count></Pill>)}
            </Track> : <span />}
            <div className="flex flex-wrap items-center gap-3 pb-2 max-lg:order-first">
              <label className="relative min-w-0 flex-1 basis-56">
                <span className="sr-only">Search {props.title.toLocaleLowerCase()}</span>
                <Search aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" className="h-8 rounded-[5px] pl-8 max-sm:h-10" />
              </label>
              <Track label="Sort" className="border-b-0 gap-4">
                <Pill active={sort === 'default'} onClick={() => setSort('default')}>Recent</Pill>
                <Pill active={sort === 'title-asc'} onClick={() => setSort('title-asc')}>Name</Pill>
                <Pill active={sort === 'status'} onClick={() => setSort('status')}>Status</Pill>
              </Track>
            </div>
          </div>

          {filteredItems.length === 0
            ? <EmptyBand>No results match these filters</EmptyBand>
            : <div className="min-w-0 overflow-x-auto rounded-[6px] border border-border bg-card">
              <table aria-label={props.title} className="w-full min-w-[640px] border-collapse text-[13px]">
                <thead className="bg-muted/50"><tr className="border-b border-border">
                  <th scope="col" className="h-8 px-3 text-left text-xs font-medium text-muted-foreground">{props.title.replace(/s$/, '')}</th>
                  {columns.map((label) => <th key={label} scope="col" className="h-8 whitespace-nowrap px-3 text-left text-xs font-medium text-muted-foreground">{label}</th>)}
                  <th scope="col" className="h-8 px-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th scope="col" className="h-8 px-3"><span className="sr-only">Actions</span></th>
                </tr></thead>
                <tbody>{filteredItems.map((item) => <OperationalRow key={item.id} item={item} columns={columns} attention={Boolean(item.status && attentionStatuses.has(item.status))} />)}</tbody>
              </table>
            </div>}
          <p className="text-xs tabular-nums text-muted-foreground" aria-live="polite">{filteredItems.length} of {props.items.length}</p>
        </>}

        {props.primaryAction && 'listKey' in props.primaryAction && (
          <CreateItemDrawerClientWrapper listKey={props.primaryAction.listKey} open={createOpen} onClose={() => setCreateOpen(false)} onCreate={() => router.refresh()} />
        )}

        {!props.error && props.items.length === 0 && !props.disabledMessage && <EmptyBand>{props.emptyMessage}</EmptyBand>}
      </div>
    </PageContainer>
  )
}
