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
    <div className="w-full max-w-6xl space-y-4 p-4 md:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <TitleLine title={meta ? <><span className="font-normal text-muted-foreground">{meta}</span> {title}</> : title} tone={state ? tone : undefined} state={state} />
          {description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </header>
      {warning && <Callout tone="warn">{warning}</Callout>}
      {children}
    </div>
  </section>
}

export function TaskSection({ title, count, action, children }: { title: string; count?: number; action?: ReactNode; children: ReactNode }) {
  return <section className="min-w-0 overflow-hidden rounded-[6px] border border-border bg-card">
    <div className="flex min-h-10 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-2">
      <h2 className="flex items-baseline gap-2 text-[13px] font-semibold text-foreground">{title}{count !== undefined && <Count>{count}</Count>}</h2>
      {action}
    </div>
    <div className="px-4 py-3.5">{children}</div>
  </section>
}
