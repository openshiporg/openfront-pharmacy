import type { ReactNode } from 'react'

import { PageBreadcrumbs } from '@/features/dashboard/components/PageBreadcrumbs'
import { Callout, Count, TitleLine, type DotTone } from './rx-ui'

/**
 * Detail/task screen shell: reference PageBreadcrumbs header (with SidebarTrigger)
 * over a padded content column. The record's state sits on the title line.
 */
export function TaskPage({ parent, meta, title, description, warning, state, tone, actions, children }: {
  /** Parent screen, href relative to the dashboard basePath (e.g. "/platform/orders"). */
  parent?: { label: string; href: string }
  meta?: string
  title: string
  description?: string
  warning?: string
  state?: string
  tone?: DotTone
  actions?: ReactNode
  children?: ReactNode
}) {
  const items = [
    { type: 'link' as const, label: 'Dashboard', href: '/' },
    { type: 'page' as const, label: 'Platform' },
    ...(parent ? [{ type: 'link' as const, label: parent.label, href: parent.href }] : []),
    { type: 'page' as const, label: title },
  ]
  return <section className="flex flex-col overflow-hidden">
    <PageBreadcrumbs items={items} />
    <div className="w-full max-w-5xl space-y-5 p-4 md:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          {meta && <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground">{meta}</p>}
          <TitleLine className="mt-1" title={title} tone={state ? tone : undefined} state={state} />
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </header>
      {warning && <Callout tone="warn">{warning}</Callout>}
      {children}
    </div>
  </section>
}

export function TaskSection({ title, count, action, children }: { title: string; count?: number; action?: ReactNode; children: ReactNode }) {
  return <section className="overflow-hidden rounded-xl bg-background ring-1 ring-border">
    <div className="flex flex-wrap items-baseline justify-between gap-3 border-b bg-muted/40 px-4 py-2.5 sm:px-5">
      <h2 className="flex items-baseline gap-2 text-sm font-semibold text-foreground">{title}{count !== undefined && <Count>{count}</Count>}</h2>
      {action}
    </div>
    <div className="px-4 py-4 sm:px-5">{children}</div>
  </section>
}
