'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { AlertCircle, ArrowRight, ChevronDown, CirclePlus, MoreHorizontal, Search } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageContainer } from '@/features/dashboard/components/PageContainer'
import { basePath } from '@/features/dashboard/lib/config'
import { cn } from '@/lib/utils'
import { CreateItemDrawerClientWrapper } from './CreateItemDrawerClientWrapper'

export type OperationalItem = {
  id: string
  href?: string
  title: string
  subtitle?: string
  status?: string
  details?: Array<{ label: string; value: string }>
}

type SortMode = 'default' | 'title-asc' | 'title-desc' | 'status'

function statusLabel(status?: string) {
  return status ? status.replaceAll('_', ' ') : 'Unknown'
}

function StatusBadge({ status, needsAttention }: { status?: string; needsAttention: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 whitespace-nowrap capitalize font-medium',
        needsAttention && 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100',
      )}
    >
      <span className={cn('size-1.5 rounded-full bg-muted-foreground', needsAttention && 'bg-amber-600')} aria-hidden="true" />
      {statusLabel(status)}
    </Badge>
  )
}

function ItemActions({ item }: { item: OperationalItem }) {
  if (!item.href) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label={`Actions for ${item.title}`}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={item.href}>Open <ArrowRight className="ml-auto size-4" /></Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function DetailGrid({ item }: { item: OperationalItem }) {
  if (!item.details?.length) return <p className="text-sm text-muted-foreground">No additional details.</p>
  return (
    <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
      {item.details.map((detail) => (
        <div key={detail.label}>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{detail.label}</dt>
          <dd className="mt-1 break-words font-medium">{detail.value || 'Not recorded'}</dd>
        </div>
      ))}
    </dl>
  )
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
  attentionStatuses?: string[]
}) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState<SortMode>('default')
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const attentionStatuses = useMemo(() => new Set(props.attentionStatuses || []), [props.attentionStatuses])
  const statuses = useMemo(() => Array.from(new Set(props.items.map((item) => item.status).filter((value): value is string => Boolean(value)))).sort(), [props.items])
  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase()
    const result = props.items.filter((item) => {
      const searchable = [item.title, item.subtitle, item.status, ...(item.details || []).flatMap((detail) => [detail.label, detail.value])].filter(Boolean).join(' ').toLocaleLowerCase()
      return (!normalized || searchable.includes(normalized)) && (status === 'all' || item.status === status)
    })
    if (sort === 'default') return result
    return result.sort((a, b) => sort === 'status'
      ? statusLabel(a.status).localeCompare(statusLabel(b.status)) || a.title.localeCompare(b.title)
      : (sort === 'title-desc' ? b.title.localeCompare(a.title) : a.title.localeCompare(b.title)))
  }, [props.items, query, sort, status])
  const attentionCount = props.items.filter((item) => item.status && attentionStatuses.has(item.status)).length
  const toggle = (id: string) => setExpanded((current) => {
    const next = new Set(current)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })

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

  return (
    <PageContainer title={props.title} header={header} breadcrumbs={breadcrumbs}>
      <div className="space-y-6 px-4 pb-8 md:px-6">
        {props.error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Couldn&apos;t load {props.title.toLocaleLowerCase()}. Try again.</AlertTitle>
            <AlertDescription>{props.error}</AlertDescription>
          </Alert>
        )}
        {!props.error && props.disabledMessage && props.items.length === 0 && (
          <Alert>
            <AlertCircle className="size-4" />
            <AlertDescription>{props.disabledMessage}</AlertDescription>
          </Alert>
        )}

        {!props.error && (props.items.length > 0 || props.primaryAction) && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-56 flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" aria-label={`Search ${props.title.toLocaleLowerCase()}`} className="h-10 w-full rounded-lg pl-9" />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-10 w-44 rounded-lg" aria-label="Status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {statuses.map((entry) => <SelectItem key={entry} value={entry} className="capitalize">{statusLabel(entry)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(value) => setSort(value as SortMode)}>
              <SelectTrigger className="h-10 w-44 rounded-lg" aria-label="Sort"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default order</SelectItem>
                <SelectItem value="title-asc">Name A–Z</SelectItem>
                <SelectItem value="title-desc">Name Z–A</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
            {props.primaryAction && ('href' in props.primaryAction ? (
              <Button asChild className="rounded-lg">
                <Link href={props.primaryAction.href}><CirclePlus className="size-4" />{props.primaryAction.label}</Link>
              </Button>
            ) : (
              <Button type="button" className="rounded-lg" onClick={() => setCreateOpen(true)}><CirclePlus className="size-4" />{props.primaryAction.label}</Button>
            ))}
          </div>
        )}

        {!props.error && props.items.length > 0 && <>
          <section aria-label="Summary" className="grid gap-3 sm:grid-cols-3">
            <Card className="shadow-none"><CardContent className="p-5"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Records</p><p className="mt-2 text-3xl font-semibold">{props.items.length}</p></CardContent></Card>
            <Card className="shadow-none"><CardContent className="p-5"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Statuses</p><p className="mt-2 text-3xl font-semibold">{statuses.length}</p></CardContent></Card>
            <Card className="shadow-none"><CardContent className="p-5"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Needs attention</p><p className="mt-2 text-3xl font-semibold">{attentionCount}</p></CardContent></Card>
          </section>

          <p className="text-sm text-muted-foreground" aria-live="polite">Showing {filteredItems.length} of {props.items.length}</p>

          {filteredItems.length === 0 ? <Card className="border-dashed shadow-none"><CardContent className="flex min-h-40 items-center justify-center text-center text-sm text-muted-foreground">No results match your search.</CardContent></Card> : <>
            <div className="hidden overflow-hidden rounded-xl border bg-background md:block">
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Status</TableHead><TableHead>Summary</TableHead><TableHead className="w-24 text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>{filteredItems.map((item) => {
                  const isExpanded = expanded.has(item.id)
                  return [
                    <TableRow key={item.id}><TableCell><p className="font-medium">{item.title}</p>{item.subtitle && <p className="mt-1 max-w-md text-xs text-muted-foreground">{item.subtitle}</p>}</TableCell><TableCell><StatusBadge status={item.status} needsAttention={Boolean(item.status && attentionStatuses.has(item.status))} /></TableCell><TableCell><span className="text-sm text-muted-foreground">{item.details?.slice(0, 2).map((detail) => `${detail.label}: ${detail.value}`).join(' · ')}</span></TableCell><TableCell><div className="flex justify-end"><Button type="button" variant="ghost" size="icon" onClick={() => toggle(item.id)} aria-expanded={isExpanded} aria-controls={`details-${item.id}`} aria-label={`${isExpanded ? 'Hide' : 'Show'} details for ${item.title}`}><ChevronDown className={cn('size-4 transition-transform', isExpanded && 'rotate-180')} /></Button><ItemActions item={item} /></div></TableCell></TableRow>,
                    isExpanded && <TableRow key={`${item.id}:details`} id={`details-${item.id}`}><TableCell colSpan={4} className="bg-muted/30"><DetailGrid item={item} /></TableCell></TableRow>,
                  ]
                })}</TableBody>
              </Table>
            </div>

            <div className="grid gap-3 md:hidden">{filteredItems.map((item) => {
              const isExpanded = expanded.has(item.id)
              return <Card key={item.id} className="shadow-none"><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="font-semibold">{item.title}</h2>{item.subtitle && <p className="mt-1 text-sm text-muted-foreground">{item.subtitle}</p>}<div className="mt-3"><StatusBadge status={item.status} needsAttention={Boolean(item.status && attentionStatuses.has(item.status))} /></div></div><ItemActions item={item} /></div><Button type="button" variant="ghost" className="mt-3 w-full justify-between" onClick={() => toggle(item.id)} aria-expanded={isExpanded} aria-controls={`mobile-details-${item.id}`}>Details <ChevronDown className={cn('size-4 transition-transform', isExpanded && 'rotate-180')} /></Button>{isExpanded && <div id={`mobile-details-${item.id}`} className="border-t pt-4"><DetailGrid item={item} /></div>}</CardContent></Card>
            })}</div>
          </>}
        </>}

        {props.primaryAction && 'listKey' in props.primaryAction && (
          <CreateItemDrawerClientWrapper listKey={props.primaryAction.listKey} open={createOpen} onClose={() => setCreateOpen(false)} onCreate={() => router.refresh()} />
        )}

        {!props.error && props.items.length === 0 && !props.disabledMessage && <Card className="border-dashed shadow-none"><CardContent className="flex min-h-56 items-center justify-center px-6 text-center text-sm text-muted-foreground">{props.emptyMessage}</CardContent></Card>}
      </div>
    </PageContainer>
  )
}
