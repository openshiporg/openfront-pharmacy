import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

import { PageBreadcrumbs } from '@/features/dashboard/components/PageBreadcrumbs'
import { basePath } from '@/features/dashboard/lib/config'
import { platformNavItems } from '@/features/platform/lib/navigation'

export function PharmacyOverviewPage() {
  const destinations = platformNavItems.filter((item) => item.href !== '/platform/overview')
  return (
    <section className="flex flex-col overflow-hidden">
      <PageBreadcrumbs
        items={[
          { type: 'link', label: 'Dashboard', href: '/' },
          { type: 'page', label: 'Platform' },
          { type: 'page', label: 'Overview' },
        ]}
      />
      <div className="w-full max-w-5xl p-4 md:p-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Overview</h1>
        <p className="text-muted-foreground">Pharmacy operations at a glance.</p>
        <nav aria-label="Platform" className="mt-6 grid gap-3 sm:grid-cols-2">
          {destinations.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={`${basePath}${item.href}`} className="flex min-h-20 items-start gap-3 rounded-xl border bg-background p-5 transition-colors hover:bg-muted/40">
                {Icon && <Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />}
                <span className="min-w-0">
                  <span className="block font-semibold">{item.title}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{item.description}</span>
                </span>
                <ArrowUpRight className="ml-auto size-4 shrink-0 text-muted-foreground" />
              </Link>
            )
          })}
        </nav>
      </div>
    </section>
  )
}
