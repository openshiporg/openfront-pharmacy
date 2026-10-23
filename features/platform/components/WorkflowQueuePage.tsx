'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { ChevronRight, Plus, Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageContainer } from '@/features/dashboard/components/PageContainer'
import { basePath } from '@/features/dashboard/lib/config'
import { cn } from '@/lib/utils'
import { Callout, Count, Dot, EmptyBand, ListBand, Pill, PillLink, RaisedLink, Track, humanize, primaryPillClass, trackClass, type DotTone } from './rx-ui'

export type WorkflowPriority = 'critical' | 'attention' | 'routine'

export type WorkflowQueueItem = {
  id: string
  href: string
  title: string
  subtitle: string
  state: string
  priority: WorkflowPriority
  priorityLabel: string
  ageLabel: string
  sortValue: number
  location: string
  exceptions: string[]
  context: Array<{ label: string; value: string }>
  nextDecision: string
  decisionHint: string
}

/** A filter applied by the server query through a URL search param. */
export type WorkflowQueueFilter = {
  param: string
  label: string
  allLabel: string
  value: string | null
  options: ReadonlyArray<readonly [string, string]>
}

type SortMode = 'priority' | 'age' | 'title'

const ALL = '__all__'
const priorityRank: Record<WorkflowPriority, number> = { critical: 0, attention: 1, routine: 2 }
const priorityTone: Record<WorkflowPriority, DotTone> = { critical: 'danger', attention: 'warn', routine: 'muted' }
const priorityTabs: Array<[WorkflowPriority, string]> = [['critical', 'Urgent'], ['attention', 'Attention'], ['routine', 'Routine']]

function ServerFilter({ filter }: { filter: WorkflowQueueFilter }) {
  const pathname = usePathname() ?? '/'
  const searchParams = useSearchParams()
  const hrefFor = (value: string | null) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    if (value) params.set(filter.param, value)
    else params.delete(filter.param)
    params.delete('after')
    const query = params.toString()
    return query ? `${pathname}?${query}` : pathname
  }
  return <Track label={filter.label}>
    <PillLink href={hrefFor(null)} active={!filter.value} scroll={false}>All</PillLink>
    {filter.options.map(([value, label]) => <PillLink key={value} href={hrefFor(value)} active={filter.value === value} scroll={false}>{label}</PillLink>)}
  </Track>
}

function PageNav({ previousPageHref, nextPageHref }: { previousPageHref?: string; nextPageHref?: string }) {
  if (!previousPageHref && !nextPageHref) return null
  return <nav aria-label="Pages" className="flex justify-between gap-3">
    {previousPageHref ? <RaisedLink href={previousPageHref}>First page</RaisedLink> : <span />}
    {nextPageHref && <RaisedLink href={nextPageHref}>Next page</RaisedLink>}
  </nav>
}

function QueueRow({ item }: { item: WorkflowQueueItem }) {
  return <article className="grid gap-4 bg-background px-4 py-4 sm:px-5 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-8">
    <div className="min-w-0">
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="min-w-0 text-[15px] font-semibold tracking-tight text-foreground"><Link href={item.href} className="hover:underline hover:underline-offset-4">{item.title}</Link></h2>
        <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap text-sm capitalize text-muted-foreground"><Dot tone={priorityTone[item.priority]} />{humanize(item.state)}</span>
      </div>
      <p className="mt-0.5 truncate text-sm text-muted-foreground">{item.subtitle}</p>
      <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-3 xl:grid-cols-4">
        {item.context.map((entry) => <div key={entry.label} className="min-w-0">
          <dt className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">{entry.label}</dt>
          <dd className="mt-0.5 truncate text-[13px] font-medium text-foreground" title={entry.value}>{entry.value || 'Not recorded'}</dd>
        </div>)}
      </dl>
      {item.exceptions.length > 0 && <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Exceptions">
        {item.exceptions.map((exception) => <li key={exception} className={cn('inline-flex items-baseline gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', item.priority === 'critical' ? 'bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-100' : 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100')}><Dot tone={item.priority === 'critical' ? 'danger' : 'warn'} className="size-1.5" />{exception}</li>)}
      </ul>}
    </div>
    <div className="flex min-w-0 flex-col gap-3 border-t border-dashed pt-3 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
      <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] tabular-nums text-muted-foreground"><span>{item.ageLabel}</span><span>{item.location}</span></div>
      <div className="min-w-0">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">Next</p>
        <p className="mt-0.5 text-sm font-semibold text-foreground">{item.nextDecision}</p>
      </div>
      <Link href={item.href} aria-label={`Open ${item.title}`} className={cn(primaryPillClass, 'mt-auto w-full justify-between lg:w-auto')}>Open<ChevronRight aria-hidden="true" className="size-4" /></Link>
    </div>
  </article>
}

export function WorkflowQueuePage(props: {
  title: string
  description: string
  items: WorkflowQueueItem[]
  emptyMessage: string
  error?: string
  filters?: WorkflowQueueFilter[]
  primaryAction?: { href: string; label: string }
  totalCount?: number
  previousPageHref?: string
  nextPageHref?: string
}) {
  const [query, setQuery] = useState('')
  const [priority, setPriority] = useState<WorkflowPriority | typeof ALL>(ALL)
  const [location, setLocation] = useState(ALL)
  const [state, setState] = useState(ALL)
  const [sort, setSort] = useState<SortMode>('priority')
  const hasServerStatusFilter = Boolean(props.filters?.some((filter) => filter.param === 'status'))
  const states = useMemo(() => Array.from(new Set(props.items.map((item) => item.state))).sort(), [props.items])
  const locations = useMemo(() => Array.from(new Set(props.items.map((item) => item.location))).sort(), [props.items])
  const priorityCounts = useMemo(() => props.items.reduce<Record<WorkflowPriority, number>>((counts, item) => ({ ...counts, [item.priority]: counts[item.priority] + 1 }), { critical: 0, attention: 0, routine: 0 }), [props.items])
  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase()
    const result = props.items.filter((item) => {
      const searchable = [item.title, item.subtitle, item.state, item.location, item.nextDecision, ...item.exceptions, ...item.context.flatMap((entry) => [entry.label, entry.value])].join(' ').toLocaleLowerCase()
      return (!normalized || searchable.includes(normalized)) && (priority === ALL || item.priority === priority) && (state === ALL || item.state === state) && (location === ALL || item.location === location)
    })
    return [...result].sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title)
      if (sort === 'age') return a.sortValue - b.sortValue
      return priorityRank[a.priority] - priorityRank[b.priority] || a.sortValue - b.sortValue
    })
  }, [location, priority, props.items, query, sort, state])

  const breadcrumbs = [
    { type: 'link' as const, label: 'Dashboard', href: basePath },
    { type: 'page' as const, label: 'Platform' },
    { type: 'page' as const, label: props.title },
  ]
  const total = props.totalCount ?? props.items.length
  const urgent = priorityCounts.critical

  const header = <div className="flex flex-wrap items-end justify-between gap-3">
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{props.title}</h1>
      <Count>{total}</Count>
      {!props.error && props.items.length > 0 && <span className="inline-flex items-baseline gap-1.5 text-sm text-muted-foreground"><Dot tone={urgent ? 'danger' : priorityCounts.attention ? 'warn' : 'ok'} />{urgent ? `${urgent} urgent` : priorityCounts.attention ? `${priorityCounts.attention} need attention` : 'Clear'}</span>}
    </div>
    {props.primaryAction && <Link href={props.primaryAction.href} className={primaryPillClass}><Plus aria-hidden="true" className="size-4" />{props.primaryAction.label}</Link>}
  </div>

  return <PageContainer title={props.title} header={header} breadcrumbs={breadcrumbs}>
    <div className="space-y-4 px-4 pb-8 md:px-6">
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <label className={cn(trackClass, 'relative min-w-0 flex-1 basis-56 overflow-visible')}>
            <span className="sr-only">Search {props.title.toLocaleLowerCase()}</span>
            <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" className="h-8 rounded-full border-0 bg-transparent pl-8 shadow-none focus-visible:ring-0 max-sm:h-10 dark:bg-transparent" />
          </label>
          <Track label="Priority">
            <Pill active={priority === ALL} onClick={() => setPriority(ALL)}>All <Count>{props.items.length}</Count></Pill>
            {priorityTabs.map(([value, label]) => <Pill key={value} active={priority === value} onClick={() => setPriority(value)}><Dot tone={priorityTone[value]} className="size-1.5 translate-y-0" />{label} <Count>{priorityCounts[value]}</Count></Pill>)}
          </Track>
          <Track label="Sort">
            <Pill active={sort === 'priority'} onClick={() => setSort('priority')}>Priority</Pill>
            <Pill active={sort === 'age'} onClick={() => setSort('age')}>Oldest</Pill>
            <Pill active={sort === 'title'} onClick={() => setSort('title')}>Name</Pill>
          </Track>
          {locations.length > 1 && <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className="h-9 w-44 rounded-full" aria-label="Location"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All locations</SelectItem>
              {locations.map((entry) => <SelectItem key={entry} value={entry}>{entry}</SelectItem>)}
            </SelectContent>
          </Select>}
        </div>
        {props.filters?.map((filter) => <ServerFilter key={filter.param} filter={filter} />)}
        {!hasServerStatusFilter && states.length > 1 && <Track label="Status">
          <Pill active={state === ALL} onClick={() => setState(ALL)}>All</Pill>
          {states.map((entry) => <Pill key={entry} active={state === entry} onClick={() => setState(entry)} className="capitalize">{humanize(entry)} <Count>{props.items.filter((item) => item.state === entry).length}</Count></Pill>)}
        </Track>}
      </div>

      {props.error && <Callout tone="danger" title={`Couldn't load ${props.title.toLocaleLowerCase()}`}>{props.error}</Callout>}

      {!props.error && props.items.length > 0 && <>
        <p className="font-mono text-[11px] tabular-nums text-muted-foreground" aria-live="polite">{filteredItems.length} of {total}</p>
        {filteredItems.length === 0
          ? <EmptyBand>No results match these filters</EmptyBand>
          : <ListBand aria-label={props.title} className="bg-border/60">{filteredItems.map((item) => <QueueRow key={item.id} item={item} />)}</ListBand>}
      </>}

      {!props.error && props.items.length === 0 && <EmptyBand>{(props.totalCount ?? 0) > 0 ? 'No results on this page' : props.emptyMessage}</EmptyBand>}
      {!props.error && <PageNav previousPageHref={props.previousPageHref} nextPageHref={props.nextPageHref} />}
    </div>
  </PageContainer>
}
