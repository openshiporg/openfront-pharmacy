'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { AlertCircle, ArrowRight, CirclePlus, Clock3, MapPin, Search } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageContainer } from '@/features/dashboard/components/PageContainer'
import { basePath } from '@/features/dashboard/lib/config'
import { cn } from '@/lib/utils'

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

function humanize(value: string) {
  return value.replaceAll('_', ' ')
}

function PriorityBadge({ item }: { item: WorkflowQueueItem }) {
  return <Badge variant="outline" className={cn(
    'whitespace-nowrap font-medium',
    item.priority === 'critical' && 'border-red-300 bg-red-50 text-red-950 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100',
    item.priority === 'attention' && 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100',
  )}>{item.priorityLabel}</Badge>
}

function ServerFilter({ filter }: { filter: WorkflowQueueFilter }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const onChange = (value: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    if (value === ALL) params.delete(filter.param)
    else params.set(filter.param, value)
    params.delete('after')
    const query = params.toString()
    router.push(query ? `${pathname ?? ""}?${query}` : (pathname ?? "/"))
  }
  return (
    <Select value={filter.value || ALL} onValueChange={onChange}>
      <SelectTrigger className="h-10 w-48 rounded-lg" aria-label={filter.label}><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{filter.allLabel}</SelectItem>
        {filter.options.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

function PageNav({ previousPageHref, nextPageHref }: { previousPageHref?: string; nextPageHref?: string }) {
  if (!previousPageHref && !nextPageHref) return null
  return <nav aria-label="Pages" className="flex justify-between border-t pt-4">{previousPageHref ? <Button asChild variant="outline"><Link href={previousPageHref}>First page</Link></Button> : <span />}{nextPageHref && <Button asChild variant="outline"><Link href={nextPageHref}>Next page</Link></Button>}</nav>
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
  const [state, setState] = useState(ALL)
  const [location, setLocation] = useState(ALL)
  const [sort, setSort] = useState<SortMode>('priority')
  const hasServerStatusFilter = Boolean(props.filters?.some((filter) => filter.param === 'status'))
  const states = useMemo(() => Array.from(new Set(props.items.map((item) => item.state))).sort(), [props.items])
  const locations = useMemo(() => Array.from(new Set(props.items.map((item) => item.location))).sort(), [props.items])
  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase()
    const result = props.items.filter((item) => {
      const searchable = [item.title, item.subtitle, item.state, item.location, item.nextDecision, ...item.exceptions, ...item.context.flatMap((entry) => [entry.label, entry.value])].join(' ').toLocaleLowerCase()
      return (!normalized || searchable.includes(normalized)) && (state === ALL || item.state === state) && (location === ALL || item.location === location)
    })
    return [...result].sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title)
      if (sort === 'age') return a.sortValue - b.sortValue
      return priorityRank[a.priority] - priorityRank[b.priority] || a.title.localeCompare(b.title)
    })
  }, [location, props.items, query, sort, state])

  const breadcrumbs = [
    { type: 'link' as const, label: 'Dashboard', href: basePath },
    { type: 'page' as const, label: 'Platform' },
    { type: 'page' as const, label: props.title },
  ]

  const header = (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">{props.title}</h1>
      <p className="text-muted-foreground">{props.description}</p>
    </div>
  )

  return <PageContainer title={props.title} header={header} breadcrumbs={breadcrumbs}>
    <div className="space-y-6 px-4 pb-8 md:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" aria-label={`Search ${props.title.toLocaleLowerCase()}`} className="h-10 w-full rounded-lg pl-9" />
        </div>
        {props.filters?.map((filter) => <ServerFilter key={filter.param} filter={filter} />)}
        {!hasServerStatusFilter && (
          <Select value={state} onValueChange={setState}>
            <SelectTrigger className="h-10 w-44 rounded-lg" aria-label="Status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {states.map((entry) => <SelectItem key={entry} value={entry} className="capitalize">{humanize(entry)}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        {locations.length > 1 && (
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className="h-10 w-44 rounded-lg" aria-label="Location"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All locations</SelectItem>
              {locations.map((entry) => <SelectItem key={entry} value={entry}>{entry}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Select value={sort} onValueChange={(value) => setSort(value as SortMode)}>
          <SelectTrigger className="h-10 w-44 rounded-lg" aria-label="Sort"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="age">Oldest first</SelectItem>
            <SelectItem value="title">Name</SelectItem>
          </SelectContent>
        </Select>
        {props.primaryAction && <Button asChild className="rounded-lg"><Link href={props.primaryAction.href}><CirclePlus className="size-4" />{props.primaryAction.label}</Link></Button>}
      </div>

      {props.error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Couldn&apos;t load {props.title.toLocaleLowerCase()}. Try again.</AlertTitle>
          <AlertDescription>{props.error}</AlertDescription>
        </Alert>
      )}

      {!props.error && props.items.length > 0 && <>
        <p className="text-sm text-muted-foreground" aria-live="polite">Showing {filteredItems.length} of {props.totalCount ?? props.items.length}</p>

        {filteredItems.length === 0 ? <Card className="border-dashed shadow-none"><CardContent className="flex min-h-40 items-center justify-center text-center text-sm text-muted-foreground">No results match your search.</CardContent></Card> : <section aria-label={props.title} className="space-y-3">{filteredItems.map((item) => <Card key={item.id} className={cn('overflow-hidden shadow-none', item.priority === 'critical' && 'border-red-300 dark:border-red-900')}><CardContent className="p-0">
          <div className="grid gap-5 p-5 xl:grid-cols-[minmax(16rem,1.25fr)_minmax(18rem,1fr)_minmax(15rem,.8fr)] xl:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><span aria-hidden="true" className={cn('size-2 shrink-0 rounded-full', item.priority === 'critical' ? 'bg-red-500' : item.priority === 'attention' ? 'bg-amber-500' : 'bg-muted-foreground/50')} /><h2 className="text-lg font-semibold tracking-tight">{item.title}</h2><Badge variant="secondary" className="capitalize">{humanize(item.state)}</Badge><PriorityBadge item={item} /></div>
              <p className="mt-1 text-sm text-muted-foreground">{item.subtitle}</p>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5"><Clock3 className="size-3.5" />{item.ageLabel}</span><span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" />{item.location}</span></div>
            </div>
            <div>
              <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">{item.context.map((entry) => <div key={entry.label} className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3 text-sm"><dt className="text-muted-foreground">{entry.label}</dt><dd className="break-words font-medium">{entry.value || 'Not recorded'}</dd></div>)}</dl>
              {item.exceptions.length > 0 && <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"><p className="flex items-center gap-2 font-semibold"><AlertCircle className="size-4" />Needs attention</p><ul className="mt-2 list-disc space-y-1 pl-5">{item.exceptions.map((exception) => <li key={exception}>{exception}</li>)}</ul></div>}
            </div>
            <aside className="rounded-xl border bg-muted/25 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next step</p>
              <p className="mt-2 font-semibold">{item.nextDecision}</p>
              <Button asChild className="mt-4 w-full justify-between whitespace-nowrap text-sm"><Link href={item.href}>Open<ArrowRight className="size-4" /></Link></Button>
            </aside>
          </div>
        </CardContent></Card>)}</section>}
      </>}

      {!props.error && props.items.length === 0 && <Card className="border-dashed shadow-none"><CardContent className="flex min-h-56 items-center justify-center px-6 text-center text-sm text-muted-foreground">{(props.totalCount ?? 0) > 0 ? 'No results on this page.' : props.emptyMessage}</CardContent></Card>}
      {!props.error && <PageNav previousPageHref={props.previousPageHref} nextPageHref={props.nextPageHref} />}
    </div>
  </PageContainer>
}
