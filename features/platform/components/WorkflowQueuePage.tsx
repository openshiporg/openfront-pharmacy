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
import { Callout, Count, Dot, EmptyBand, Pill, PillLink, RaisedLink, StatusText, Track, buttonClass, humanize, primaryPillClass, type DotTone } from './rx-ui'

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
  const [lead, second] = item.context
  return <tr className="border-b border-border/70 align-baseline transition-colors last:border-b-0 hover:bg-muted/30">
    <td className="whitespace-nowrap px-3 py-2.5"><StatusText tone={priorityTone[item.priority]}>{item.priority === 'critical' ? 'Urgent' : item.priority === 'attention' ? 'Attention' : 'Routine'}</StatusText></td>
    <td className="px-3 py-2.5">
      <Link href={item.href} className="font-medium text-foreground underline-offset-4 hover:underline">{item.title}</Link>
      <span className="block truncate text-xs text-muted-foreground">{item.subtitle}</span>
      {item.exceptions.length > 0 && <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5" aria-label="Exceptions">
        {item.exceptions.map((exception) => <li key={exception} className={cn('inline-flex items-baseline gap-1.5 text-xs', item.priority === 'critical' ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400')}><Dot tone={item.priority === 'critical' ? 'danger' : 'warn'} />{exception}</li>)}
      </ul>}
    </td>
    <td className="max-w-48 px-3 py-2.5 text-muted-foreground">{lead && <span className="block truncate" title={lead.value}>{lead.value || 'Not recorded'}</span>}{second && <span className="block truncate text-xs" title={second.value}>{second.value || 'Not recorded'}</span>}</td>
    <td className="whitespace-nowrap px-3 py-2.5">{humanize(item.state).replace(/^./, (letter) => letter.toUpperCase())}</td>
    <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground tabular-nums">{item.ageLabel}<span className="block text-xs">{item.location}</span></td>
    <td className="px-3 py-2.5 font-medium" title={item.decisionHint}>{item.nextDecision}</td>
    <td className="px-3 py-2 text-right"><Link href={item.href} aria-label={`Open ${item.title}`} className={buttonClass}>Open<ChevronRight aria-hidden="true" className="size-3.5" /></Link></td>
  </tr>
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
      <h1 className="text-lg font-semibold tracking-tight text-foreground">{props.title}</h1>
      <Count>{total}</Count>
      {!props.error && props.items.length > 0 && <StatusText tone={urgent ? 'danger' : priorityCounts.attention ? 'warn' : 'ok'}>{urgent ? `${urgent} urgent` : priorityCounts.attention ? `${priorityCounts.attention} need attention` : 'Clear'}</StatusText>}
    </div>
    {props.primaryAction && <Link href={props.primaryAction.href} className={primaryPillClass}><Plus aria-hidden="true" className="size-4" />{props.primaryAction.label}</Link>}
  </div>

  return <PageContainer title={props.title} header={header} breadcrumbs={breadcrumbs}>
    <div className="space-y-4 px-4 pb-8 md:px-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 border-b border-border lg:flex-row lg:items-end lg:justify-between">
          <Track label="Priority" className="border-b-0">
            <Pill active={priority === ALL} onClick={() => setPriority(ALL)}>All <Count>{props.items.length}</Count></Pill>
            {priorityTabs.map(([value, label]) => <Pill key={value} active={priority === value} onClick={() => setPriority(value)}><Dot tone={priorityTone[value]} />{label} <Count>{priorityCounts[value]}</Count></Pill>)}
          </Track>
          <div className="flex flex-wrap items-center gap-3 pb-2 max-lg:order-first">
            <label className="relative min-w-0 flex-1 basis-56">
              <span className="sr-only">Search {props.title.toLocaleLowerCase()}</span>
              <Search aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" className="h-8 rounded-[5px] pl-8 max-sm:h-10" />
            </label>
            <Track label="Sort" className="gap-4 border-b-0">
              <Pill active={sort === 'priority'} onClick={() => setSort('priority')}>Priority</Pill>
              <Pill active={sort === 'age'} onClick={() => setSort('age')}>Oldest</Pill>
              <Pill active={sort === 'title'} onClick={() => setSort('title')}>Name</Pill>
            </Track>
            {locations.length > 1 && <Select value={location} onValueChange={setLocation}>
              <SelectTrigger className="h-8 w-44 rounded-[5px]" aria-label="Location"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All locations</SelectItem>
                {locations.map((entry) => <SelectItem key={entry} value={entry}>{entry}</SelectItem>)}
              </SelectContent>
            </Select>}
          </div>
        </div>
        {props.filters?.map((filter) => <ServerFilter key={filter.param} filter={filter} />)}
        {!hasServerStatusFilter && states.length > 1 && <Track label="Status">
          <Pill active={state === ALL} onClick={() => setState(ALL)}>All states</Pill>
          {states.map((entry) => <Pill key={entry} active={state === entry} onClick={() => setState(entry)}>{humanize(entry).replace(/^./, (letter) => letter.toUpperCase())} <Count>{props.items.filter((item) => item.state === entry).length}</Count></Pill>)}
        </Track>}
      </div>

      {props.error && <Callout tone="danger" title={`Couldn't load ${props.title.toLocaleLowerCase()}`}>{props.error}</Callout>}

      {!props.error && props.items.length > 0 && <>
        {filteredItems.length === 0
          ? <EmptyBand>No results match these filters</EmptyBand>
          : <div className="min-w-0 overflow-x-auto rounded-[6px] border border-border bg-card">
            <table aria-label={props.title} className="w-full min-w-[860px] border-collapse text-[13px]">
              <thead className="bg-muted/50"><tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                <th scope="col" className="h-8 px-3 font-medium">Priority</th>
                <th scope="col" className="h-8 px-3 font-medium">{props.title.replace(/s$/, '')}</th>
                <th scope="col" className="h-8 px-3 font-medium">{props.items[0]?.context[0]?.label ?? 'Detail'}</th>
                <th scope="col" className="h-8 px-3 font-medium">State</th>
                <th scope="col" className="h-8 px-3 font-medium">Age</th>
                <th scope="col" className="h-8 px-3 font-medium">Next</th>
                <th scope="col" className="h-8 px-3"><span className="sr-only">Open</span></th>
              </tr></thead>
              <tbody>{filteredItems.map((item) => <QueueRow key={item.id} item={item} />)}</tbody>
            </table>
          </div>}
        <p className="text-xs tabular-nums text-muted-foreground" aria-live="polite">{filteredItems.length} of {total}</p>
      </>}

      {!props.error && props.items.length === 0 && <EmptyBand>{(props.totalCount ?? 0) > 0 ? 'No results on this page' : props.emptyMessage}</EmptyBand>}
      {!props.error && <PageNav previousPageHref={props.previousPageHref} nextPageHref={props.nextPageHref} />}
    </div>
  </PageContainer>
}
