import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

import { PageBreadcrumbs } from '@/features/dashboard/components/PageBreadcrumbs'

/**
 * Detail/task screen shell: reference PageBreadcrumbs header (with SidebarTrigger)
 * over a padded content column.
 */
export function TaskPage({ parent, meta, title, description, warning, children }: {
  /** Parent screen, href relative to the dashboard basePath (e.g. "/platform/orders"). */
  parent?: { label: string; href: string }
  meta?: string
  title: string
  description?: string
  warning?: string
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
    <div className="w-full max-w-5xl space-y-6 p-4 md:p-6">
      <header>
        {meta && <p className="text-sm capitalize text-muted-foreground">{meta}</p>}
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">{title}</h1>
        {description && <p className="mt-1 text-muted-foreground">{description}</p>}
      </header>
      {warning && <div role="alert" className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"><AlertTriangle className="mt-0.5 size-4 shrink-0" />{warning}</div>}
      {children}
    </div>
  </section>
}

export function TaskSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-xl border bg-background p-5 shadow-none"><h2 className="text-lg font-semibold">{title}</h2><div className="mt-4">{children}</div></section>
}
